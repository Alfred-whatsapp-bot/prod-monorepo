import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing.module';
import { CoreModule } from '../core/core.module';
import { AtendimentosComponent } from './atendimentos/atendimentos.component';
import { PaginaInicialComponent } from './pagina-inicial/pagina-inicial.component';
import { RelatoriosComponent } from './relatorios/relatorios.component';
import { ConfiguracaoComponent } from './configuracao/configuracao.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CurrencyFormatPipe } from '../utils/pipes/currency-format.pipe';
import { SecaoComponent } from './configuracao/secao/secao.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AtendimentosComponent,
    PaginaInicialComponent,
    RelatoriosComponent,
    ConfiguracaoComponent,
    CurrencyFormatPipe,
    SecaoComponent,
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    CoreModule,
    FontAwesomeModule,
    HttpClientModule,
  ],
})
export class PagesModule {}
