export interface User {
  id: number;
  username: string;
  password?: string;
  role: 'admin' | 'user' | 'guest';
}

export interface Role {
  id: number;
  name: string;
}
