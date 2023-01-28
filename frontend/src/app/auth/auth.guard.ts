import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  isAuthenticationRequired = true;

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (route.data.requiresAuth) {
      this.isAuthenticationRequired = true;
    }
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      if (this.isAuthenticationRequired) {
        this.router.navigate(["/login"]);
        return false;
      } else {
        return true;
      }
    }
  }
}
