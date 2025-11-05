import type { Member } from '@/types/user';

export interface MockMemberRecord extends Member {
  residentNumber: string;
  phoneNumber: string;
  signatureImage?: string | null;
}

export const mockMembers: MockMemberRecord[] = [
  {
    id: 101,
    name: '김판매',
    residentNumber: '900101-1234567',
    phoneNumber: '010-1111-2222',
    signatureImage: '/assets/mock_signature_1.png',
  },
  {
    id: 201,
    name: '이구매',
    residentNumber: '920202-2345678',
    phoneNumber: '010-3333-4444',
    signatureImage: '/assets/mock_signature_2.png',
  },
  {
    id: 301,
    name: '박관리',
    residentNumber: '950303-3456789',
    phoneNumber: '010-5555-6666',
    signatureImage: '/assets/mock_signature_3.png',
  },
];
