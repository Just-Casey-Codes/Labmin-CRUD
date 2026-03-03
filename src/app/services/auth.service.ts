import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'labmin_session';
  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private userService: UserService) {
    this.loadSession();
  }

  private loadSession(): void {
    const data = localStorage.getItem(this.SESSION_KEY);
    if (data) {
      const sessionUser: User = JSON.parse(data);
      // Re-fetch from store to get latest data
      const freshUser = this.userService.getUserById(sessionUser.id);
      if (freshUser) {
        this.currentUser.set(freshUser);
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
    }
  }

  login(username: string, password: string): { success: boolean; message: string } {
    const users = this.userService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser.set(user);
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      return { success: true, message: 'Login successful' };
    }
    return { success: false, message: 'Invalid username or password' };
  }

  signup(username: string, password: string): { success: boolean; message: string } {
    const users = this.userService.getUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Username already exists' };
    }
    const newUser = this.userService.createUser(username, password);
    this.currentUser.set(newUser);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(newUser));
    return { success: true, message: 'Account created successfully' };
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.SESSION_KEY);
  }

  refreshCurrentUser(): void {
    const current = this.currentUser();
    if (current) {
      const freshUser = this.userService.getUserById(current.id);
      if (freshUser) {
        this.currentUser.set(freshUser);
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(freshUser));
      }
    }
  }
}
