import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  isLogged = environment.logged;
  baseUrl: string = "";

  constructor(private http: HttpClient) {
    this.baseUrl = environment.urlApi;
  }

  login(credentials: { email: string; senha: string }): Observable<any> {
    return this.http
      .post<{ token: string }>(`${this.baseUrl}/api/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem("token", response.token);
          localStorage.setItem("sessionName", response.email);
          this.isLogged = true;
        })
      );
  }

  logout() {
    localStorage.removeItem("token");
    this.isLogged = false;
  }

  isLoggedIn(): boolean {
    console.log("isLogged: ", this.isLogged);
    return this.isLogged;
  }
}
