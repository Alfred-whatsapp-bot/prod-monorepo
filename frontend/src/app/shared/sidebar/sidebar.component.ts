import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "app/auth/auth.service";

declare const $: any;
declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  { path: "/home", title: "Início", icon: "dashboard", class: "" },
  // { path: "/perfil", title: "Perfil", icon: "person", class: "" },
  // {
  //   path: "/produtos",
  //   title: "Produtos",
  //   icon: "whatshot",
  //   class: "",
  // },
  // { path: "/dashboard", title: "Relatórios", icon: "list_alt", class: "" },
  // { path: "/envios", title: "Novo Envio", icon: "person", class: "" },
   { path: "/envios", title: "Novo Envio", icon: "list_alt", class: "" },
  // { path: "/template", title: "Mensagem", icon: "list_alt", class: "" },
];

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
})
export class SidebarComponent implements OnInit {
  menuItems: any[];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.menuItems = ROUTES.filter((menuItem) => menuItem);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }

  isMobileMenu() {
    if ($(window).width() > 991) {
      return false;
    }
    return true;
  }
}
