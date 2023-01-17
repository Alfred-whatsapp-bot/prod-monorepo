import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-configuracao',
  templateUrl: './configuracao.component.html',
  styleUrls: ['./configuracao.component.scss']
})
export class ConfiguracaoComponent implements OnInit {
  faArrowDown = faArrowDown;
  faArrowUp = faArrowUp;
  opcaoMenu: boolean = false;
  secaoSelecionada: string = '';
  listaSecoes = [
    {
      nome: 'Aperitivos',
    },
    {
      nome: 'Carnes',
    },
    {
      nome: 'Massas',
    },
    {
      nome: 'Bebidas',
    },
    {
      nome: 'Sobremesas',
    }
  ];

  items = [
    {
      nome: 'Aperitivos',
      valor: '1000.00',
    }, {
      nome: 'Aperitivos',
      valor: '10.00',
    }, {
      nome: 'Aperitivos',
      valor: '10.00',
    }, {
      nome: 'Aperitivos',
      valor: '100.00',
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  setSecaoSelecionada(secao: any) {
    this.secaoSelecionada = secao.nome
  }

  navigateTo() {
    this.router.navigate(['/secao']);
  }

}
