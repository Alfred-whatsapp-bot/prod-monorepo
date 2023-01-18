import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiConnectionService } from 'src/app/services/api-connection.service';

@Component({
  selector: 'app-pagina-inicial',
  templateUrl: './pagina-inicial.component.html',
  styleUrls: ['./pagina-inicial.component.scss'],
})
export class PaginaInicialComponent implements OnInit {
  qrCode: any;
  showQrCode = false;
  status: any;

  constructor(
    private sanitizer: DomSanitizer,
    private apiConnectionSrv: ApiConnectionService
  ) { }

  ngOnInit(): void {
    this.getQrCode();
    setInterval(() => {
      this.getStatus();
    }, 1000);
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
      this.status = data.status;
    });
  }

  start() {
    this.apiConnectionSrv.start().subscribe((data) => {
      console.log(data);
      window.location.reload();
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

  show() {
    this.showQrCode = true;
  }
}
