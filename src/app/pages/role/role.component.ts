import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './role.component.html'
})
export class RoleComponent {
  private authService = inject(AuthService);

  user = this.authService.user;
  role = computed(() => this.user()?.role ?? 'unknown');
}
