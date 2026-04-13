export interface User {
  username: string;
  email: string;
  password?: string;
  name: string;
  role: string;
  balance?: number;
  bio?: string;
  location?: string;
  skills?: string[];
  hourlyRate?: number;
}