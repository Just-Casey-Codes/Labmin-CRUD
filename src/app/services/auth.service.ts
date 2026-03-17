import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

export interface AppUser {
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private currentUser = signal<AppUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    onAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const role = this.deriveRole(firebaseUser.email ?? '');
        this.currentUser.set({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          role
        });
      } else {
        this.currentUser.set(null);
      }
    });
  }

  private deriveRole(email: string): AppUser['role'] {
    if (email.includes('admin')) return 'admin';
    if (email.includes('guest')) return 'guest';
    return 'user';
  }

  async loginAsync(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      await this.syncUser();
      return { success: true, message: 'Logged in successfully' };
    } catch (err: any) {
      return { success: false, message: this.friendlyError(err.code) };
    }
  }

  async signupAsync(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      await this.syncUser();
      return { success: true, message: 'Account created successfully' };
    } catch (err: any) {
      return { success: false, message: this.friendlyError(err.code) };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  private async syncUser(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/sync', {}));
    } catch (err) {
      console.warn('User sync failed (non-critical):', err);
    }
  }

  private friendlyError(code: string): string {
    switch (code) {
      case 'auth/invalid-email':         return 'Please enter a valid email address.';
      case 'auth/user-not-found':        return 'No account found with that email.';
      case 'auth/wrong-password':        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':    return 'Incorrect email or password.';
      case 'auth/email-already-in-use':  return 'An account with this email already exists.';
      case 'auth/weak-password':         return 'Password must be at least 6 characters.';
      case 'auth/too-many-requests':     return 'Too many attempts. Please try again later.';
      default:                           return 'Something went wrong. Please try again.';
    }
  }
}
