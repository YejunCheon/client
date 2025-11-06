# WebSocket 디버깅 가이드

## 1. 쿠키에서 토큰 확인하기

브라우저 개발자 도구 콘솔에서 실행:

```javascript
// 모든 쿠키 확인
console.log('All cookies:', document.cookie);

// 쿠키 파싱
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=');
  acc[key] = value;
  return acc;
}, {});

console.log('Parsed cookies:', cookies);
console.log('Token:', cookies.token);
```

## 2. WebSocket 연결 로그 확인

채팅방 페이지에 접속하면 다음과 같은 로그가 순서대로 출력되어야 합니다:

```
[STOMP] Attempting to connect to: http://dealchain-env.eba-tpa3rca3.ap-northeast-2.elasticbeanstalk.com/ws
[STOMP] Found token in cookie: token
[STOMP] Using token for authorization (source: cookie )
[STOMP] Creating SockJS connection...
[STOMP Debug] ...
[STOMP] SockJS connection opened
[STOMP Debug] CONNECT frame sent
[STOMP Debug] CONNECTED frame received
[STOMP] Successfully connected
```

## 3. 에러 발생 시 확인 사항

### "Failed to send message to ExecutorSubscribableChannel" 에러

이 에러는 서버 측 문제입니다. 다음을 확인하세요:

#### 백엔드 WebSocket 설정 확인 (Spring Boot 예시)

**WebSocketConfig.java**
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*") // CORS 설정
            .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/sub"); // 구독 경로
        registry.setApplicationDestinationPrefixes("/pub"); // 발행 경로
    }
}
```

**WebSocket 인증 인터셉터 (ChannelInterceptor)**
```java
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Authorization 헤더에서 토큰 추출
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                try {
                    // 토큰 검증
                    if (jwtTokenProvider.validateToken(token)) {
                        String userId = jwtTokenProvider.getUserIdFromToken(token);
                        accessor.setUser(new UsernamePasswordAuthenticationToken(userId, null));
                    } else {
                        throw new AuthenticationException("Invalid token");
                    }
                } catch (Exception e) {
                    throw new AuthenticationException("Authentication failed: " + e.getMessage());
                }
            } else {
                throw new AuthenticationException("No Authorization header found");
            }
        }

        return message;
    }
}
```

**인터셉터 등록**
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
```

## 4. 네트워크 탭에서 WebSocket 확인

1. 브라우저 개발자 도구 → Network 탭
2. WS 필터 선택
3. WebSocket 연결 확인:
   - **Request Headers**에 `Cookie: token=...` 포함 여부
   - **STOMP Frames** 확인:
     - CONNECT 프레임에 `Authorization: Bearer ...` 헤더 포함 여부
     - CONNECTED 프레임 수신 여부
     - ERROR 프레임이 있다면 에러 메시지 확인

## 5. 일반적인 문제 해결

### 토큰이 쿠키에서 읽히지 않는 경우
- 로그인 후 쿠키가 제대로 설정되었는지 확인
- 쿠키 도메인/경로 설정 확인
- 쿠키 만료 시간 확인

### CORS 에러
- 백엔드 `setAllowedOriginPatterns("*")` 또는 특정 도메인 설정
- 프록시 설정 확인 (next.config.js)

### 인증 실패
- JWT 토큰 만료 확인
- 서버 로그에서 인증 에러 메시지 확인
- Authorization 헤더 형식 확인 (`Bearer {token}`)

## 6. 현재 설정 요약

- **쿠키 이름**: `token`
- **토큰 형식**: `Bearer {JWT}`
- **WebSocket URL**: 환경 변수 `NEXT_PUBLIC_WS_URL`에서 설정
- **STOMP 엔드포인트**: `/ws`
- **구독 경로**: `/sub/chat/room/{roomId}`
- **발행 경로**: `/pub/chat/message`
