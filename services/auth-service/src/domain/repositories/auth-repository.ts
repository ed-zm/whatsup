import type { User } from '../entities/user';

export interface UserWithRolesAndPermissions {
  user: User;
  roles: string[];
  permissions: string[];
}

export interface AuthRepository {
  findUserByPhoneNumber(phoneNumber: string): Promise<User | null>;

  findOrCreateVerifiedUser(phoneNumber: string): Promise<User>;

  getUserRoles(userId: string): Promise<string[]>;

  getUserPermissions(userId: string): Promise<string[]>;

  findUserWithRolesAndPermissions(userId: string): Promise<UserWithRolesAndPermissions | null>;
}
