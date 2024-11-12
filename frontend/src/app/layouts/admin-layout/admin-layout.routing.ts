import { Routes } from "@angular/router";

import { UserProfileComponent } from "../../pages/perfil/user-profile.component";
import { TableListComponent } from "../../pages/produtos/table-list.component";
import { PaginaInicialComponent } from "app/pages/pagina-inicial/pagina-inicial.component";
import { DashboardComponent } from "app/pages/dashboard/dashboard.component";
import { TemplateMensagemComponent } from "app/pages/template-mensagem/template-mensagem.component";
import { ContatosComponent } from "app/pages/contatos/contatos.component";

export const AdminLayoutRoutes: Routes = [
  { path: "home", component: PaginaInicialComponent },
  { path: "perfil", component: UserProfileComponent },
  { path: "produtos", component: TableListComponent },
  { path: "dashboard", component: DashboardComponent },
  { path: "template", component: TemplateMensagemComponent },
  { path: "envios", component: ContatosComponent },
];
