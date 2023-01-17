import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AtendimentosComponent } from './atendimentos/atendimentos.component';
import { ConfiguracaoComponent } from './configuracao/configuracao.component';
import { PaginaInicialComponent } from './pagina-inicial/pagina-inicial.component';
import { RelatoriosComponent } from './relatorios/relatorios.component';

const routes: Routes = [
  {
    path: '',
    component: PaginaInicialComponent
  },
  {
    path: 'atendimentos',
    component: AtendimentosComponent
  },
  {
    path: 'relatorios',
    component: RelatoriosComponent
  },
  {
    path: 'configuracao',
    component: ConfiguracaoComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
