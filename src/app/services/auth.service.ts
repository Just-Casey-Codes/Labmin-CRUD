import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: { id: number; username: string; role: string };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'labmin_session';
  private http = inject(HttpClient);
  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const data = localStorage.getItem(this.SESSION_KEY);
    if (data) {
      const sessionUser: User = JSON.parse(data);
      this.currentUser.set(sessionUser);
    }
  }

  loginAsync(username: string, password: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      this.http.post<AuthResponse>('/api/auth/login', { username, password }).subscribe({
        next: (res) => {
          if (res.success && res.user) {
            const user: User = {
              id: res.user.id,
              username: res.user.username,
              role: res.user.role as User['role']
            };
            this.currentUser.set(user);
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
          }
          resolve({ success: res.success, message: res.message });
        },
        error: (err) => {
          resolve({ success: false, message: err.error?.message || 'Login failed' });
        }
      });
    });
  }

  signupAsync(username: string, password: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      this.http.post<AuthResponse>('/api/auth/signup', { username, password }).subscribe({
        next: (res) => {
          if (res.success && res.user) {
            const user: User = {
              id: res.user.id,
              username: res.user.username,
              role: res.user.role as User['role']
            };
            this.currentUser.set(user);
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
          }
          resolve({ success: res.success, message: res.message });
        },
        error: (err) => {
          resolve({ success: false, message: err.error?.message || 'Signup failed' });
        }
      });
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.SESSION_KEY);
  }

  refreshCurrentUser(): void {
    const current = this.currentUser();
    if (current) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(current));
    }
  }
}
