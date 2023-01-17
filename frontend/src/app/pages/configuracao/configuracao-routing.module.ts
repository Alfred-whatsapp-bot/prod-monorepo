import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SecaoComponent } from './secao/secao.component';

const routes: Routes = [
  {
    path: 'secao',
    component: SecaoComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfiguracaoRoutingModule { }
