import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'labmin_users';

  constructor() {
    this.seedDefaultAdmin();
  }

  private seedDefaultAdmin(): void {
    const users = this.getUsers();
    if (users.length === 0) {
      const admin: User = {
        id: this.generateId(),
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      };
      this.saveUsers([admin]);
    }
  }

  getUsers(): User[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  createUser(username: string, password: string): User {
    const users = this.getUsers();
    const role: 'admin' | 'user' = username.toLowerCase().includes('admin') ? 'admin' : 'user';
    const newUser: User = {
      id: this.generateId(),
      username,
      password,
      role
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<Pick<User, 'username' | 'role'>>): User | undefined {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    if (updates.username !== undefined) {
      users[index].username = updates.username;
      // Re-evaluate role based on new username
      users[index].role = updates.username.toLowerCase().includes('admin') ? 'admin' : 'user';
    }
    if (updates.role !== undefined) {
      users[index].role = updates.role;
    }

    this.saveUsers(users);
    return users[index];
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    this.saveUsers(filtered);
    return true;
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
