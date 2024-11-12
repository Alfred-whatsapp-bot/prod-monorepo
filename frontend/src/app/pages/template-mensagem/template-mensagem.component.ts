import { Component, OnInit } from "@angular/core";
import { ApiConnectionService } from "../../services/api-connection.service";

@Component({
  selector: "app-template-mensagem",
  templateUrl: "./template-mensagem.component.html",
  styleUrls: ["./template-mensagem.component.css"],
})
export class TemplateMensagemComponent implements OnInit {
  userMessage: string = "";
  userMessagePlaceholder: string = "";
  loading: boolean = false;

  constructor(private service: ApiConnectionService) {}

  ngOnInit(): void {
    this.loading = true;
    this.service.getMessage().subscribe((response) => {
      if (response) {
        this.userMessage = response.text;
        this.userMessagePlaceholder = response.text;
        this.loading = false;
      }
    });
  }

  get formattedMessage(): string {
    return this.userMessage.replace(/\n/g, "<br>");
  }
}
