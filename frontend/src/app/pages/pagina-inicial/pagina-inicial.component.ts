import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ApiConnectionService } from "../../services/api-connection.service";
import { Router, NavigationStart, NavigationEnd } from "@angular/router";

@Component({
  selector: "app-pagina-inicial",
  templateUrl: "./pagina-inicial.component.html",
  styleUrls: ["./pagina-inicial.component.scss"],
})
export class PaginaInicialComponent implements OnInit {
  qrCode: any;
  showQrCode = false;
  status: any;
  logs: string;
  routePath: string;
  intervalLogs: any;
  intervalConnection: any;
  connection: string = "DISCONNECTED";

  constructor(
    private sanitizer: DomSanitizer,
    private apiConnectionSrv: ApiConnectionService,
    private router: Router
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.routePath = event.url;
      }
    });
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        clearInterval(this.intervalLogs);
        clearInterval(this.intervalConnection);
      }
    });
  }

  ngOnInit(): void {
    this.intervalConnection = setInterval(() => {
      this.getConnection();
    }, 1000);

    this.intervalLogs = setInterval(() => {
      if (this.connection === "CONNECTED") {
        this.getStatus();
        this.getLogs();
        this.getQrCode();
        this.getConversation();
      }
    }, 2000);
  }

  getQrCode() {
    this.apiConnectionSrv.getQrCode().subscribe((data) => {
      this.qrCode = this.sanitizer.bypassSecurityTrustResourceUrl(
        data.qr.base64Qr
      );
    });
  }

  getStatus() {
    this.apiConnectionSrv.getStatus().subscribe((data) => {
      this.status = data.session.status;
    });
  }

  start() {
    this.apiConnectionSrv.start().subscribe((data) => {
      console.log(data);
      window.location.reload();
    });
  }

  startBot() {
    this.apiConnectionSrv.startBot().subscribe((data) => {
      console.log(data);
    });
  }

  stop() {
    this.apiConnectionSrv.stop().subscribe((data) => {
      console.log(data);
      window.location.reload();
    });
  }

  restart() {
    this.apiConnectionSrv.restart().subscribe((data) => {
      console.log(data);
      window.location.reload();
    });
  }

  async getLogs() {
    this.apiConnectionSrv.getLogs().subscribe((data) => {
      this.logs = data.logs;

      if (data.logs !== "" || data.logs !== null) {
        this.handleTexts(data.logs, "Logs");
      }
    });
  }

  async getConversation() {
    this.apiConnectionSrv.getLogs().subscribe((data) => {
      this.logs = data.conversation;

      if (data.conversation !== "" || data.conversation !== null) {
        this.handleTexts(data.conversation, "Conversas");
      }
    });
  }

  async getConnection() {
    this.apiConnectionSrv.getConnection().subscribe((data) => {
      this.connection = data.status;
    });
  }

  show() {
    this.showQrCode = true;
  }

  handleTexts(text: string, idHtml: string) {
    const getTabSelected = document.querySelector(
      "div[role='tab'][aria-selected=true] div"
    ).innerHTML;
    if (getTabSelected.includes(idHtml)) {
      const retHtml = text
        ? text
            .replace(
              /\[Receive\]/g,
              "<span class='bg-warning'>[Recebido]:</span>"
            )
            .replace(/\[Send\]/g, "<span class='bg-warning'>[Enviado]:</span>")
            .replace(/\[Error\]/g, "<span class='red'>[Erro]:</span>")
            .replace(/\[Start\]/g, "<span class='purple'>[Start]:</span>")
            .replace(/\[Init\]/g, "<span class='purple'>[Iniciando]:</span>")
            .replace(/\[Stop\]/g, "<span class='red'>[Parou]:</span>")
            .replace(/\[Restart\]/g, "<span class='red'>[Reiniciou]:</span>")
            .replace(/\[Reload\]/g, "<span class='red'>[Recarregou]:</span>")
            .replace(/\[Job\]/g, "<span class='blue'>[Job]:</span>")
            .replace(/from:/g, "<span class='white'>from:</span>")
            .replace(/to:/g, "<span class='white'>to:</span>")
            .replace(/id:/g, "<span class='white'>id:</span>")
            .replace(/parent:/g, "<span class='white'>parent:</span>")
            .replace(/pattern:/g, "<span class='white'>pattern:</span>")
            .replace(/input:/g, "<span class='white'>input:</span>")
        : "";

      if (idHtml !== null) {
        const objDiv = document.getElementById(idHtml);
        objDiv.innerHTML = retHtml;
      }
    }
  }
}
