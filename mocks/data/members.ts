import type { Member } from '@/types/user';

export interface MockMemberRecord extends Member {
  password: string;
}

export const mockMembers: MockMemberRecord[] = [
  {
    id: 101,
    userId: 'seller101',
    name: '김판매',
    ci: 'CI-KIM-SELLER-101',
    signatureImage: '/assets/mock_signature_1.png',
    password: 'Seller!123',
  },
  {
    id: 201,
    userId: 'buyer201',
    name: '이구매',
    ci: 'CI-LEE-BUYER-201',
    signatureImage: '/assets/mock_signature_2.png',
    password: 'Buyer!123',
  },
  {
    id: 301,
    userId: 'admin301',
    name: '박관리',
    ci: 'CI-PARK-ADMIN-301',
    signatureImage: '/assets/mock_signature_3.png',
    password: 'Admin!123',
  },
];
