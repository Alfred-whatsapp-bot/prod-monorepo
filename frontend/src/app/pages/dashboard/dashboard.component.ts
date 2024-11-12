import { Component, OnInit } from '@angular/core';

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  totalConversas = 0;
  tempoMedioResposta = 0;
  satisfacaoUsuarios = 0;
  automacoesAtivas = 0;

  constructor() {}

  ngOnInit(): void {}
}


