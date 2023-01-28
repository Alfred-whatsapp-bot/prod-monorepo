import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ApiConnectionService {
  baseUrl: string = "";

  constructor(private http: HttpClient) {
    this.baseUrl = environment.urlApi;
  }

  httpOptions = {
    headers: new HttpHeaders({ Authorization: "Bearer " + localStorage.token }),
  };

  getQrCode() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.httpOptions);
  }

  getStatus() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.httpOptions);
  }

  start() {
    return this.http.get<any>(
      `${this.baseUrl}/api/controls/start`,
      this.httpOptions
    );
  }

  startBot() {
    return this.http.post<any>(
      `${this.baseUrl}/api/startBot`,
      { conversationName: localStorage.getItem("sessionName") },
      this.httpOptions
    );
  }

  stop() {
    return this.http.get<any>(
      `${this.baseUrl}/api/controls/stop`,
      this.httpOptions
    );
  }

  restart() {
    return this.http.get<any>(
      `${this.baseUrl}/api/controls/restart`,
      this.httpOptions
    );
  }

  getLogs() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.httpOptions);
  }

  getConversation() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.httpOptions);
  }

  getConnection() {
    return this.http.get<any>(`${this.baseUrl}/api/connection`, this.httpOptions);
  }
}
