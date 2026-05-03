export interface AuthenticatedPrincipal {
  userId: string;
  phoneNumber: string;
  roles: string[];
  permissions: string[];
}
