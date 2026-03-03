import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  isSignup = signal(false);
  username = signal('');
  password = signal('');
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/users']);
    }
  }

  toggleMode(): void {
    this.isSignup.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSubmit(): void {
    const u = this.username().trim();
    const p = this.password().trim();

    if (!u || !p) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    if (this.isSignup()) {
      const result = this.authService.signup(u, p);
      if (result.success) {
        this.router.navigate(['/users']);
      } else {
        this.errorMessage.set(result.message);
      }
    } else {
      const result = this.authService.login(u, p);
      if (result.success) {
        this.router.navigate(['/users']);
      } else {
        this.errorMessage.set(result.message);
      }
    }
  }
}
