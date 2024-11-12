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

  private getHttpOptions() {
    const token = localStorage.getItem("token");
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  getQrCode() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.getHttpOptions());
  }

  getStatus() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.getHttpOptions());
  }

  start() {
    return this.http.get<any>(`${this.baseUrl}/api/controls/start`, this.getHttpOptions());
  }

  startBot() {
    return this.http.post<any>(`${this.baseUrl}/api/handleBot`, { conversationName: localStorage.getItem("sessionName"), order: "start" }, this.getHttpOptions());
  }

  stopBot() {
    return this.http.post<any>(`${this.baseUrl}/api/handleBot`, { conversationName: localStorage.getItem("sessionName"), order: "stop" }, this.getHttpOptions());
  }

  restart() {
    return this.http.post<any>(`${this.baseUrl}/api/handleBot`, { conversationName: localStorage.getItem("sessionName"), order: "restart" }, this.getHttpOptions());
  }

  getLogs() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.getHttpOptions());
  }

  clearLogs() {
    return this.http.get<any>(`${this.baseUrl}/api/controls/log/clear`, this.getHttpOptions());
  }

  getConversation() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.getHttpOptions());
  }

  getConnection() {
    return this.http.get<any>(`${this.baseUrl}/api/connection`, this.getHttpOptions());
  }

  getMessage() {
    return this.http.get<any>(`${this.baseUrl}/api/getmessage`, this.getHttpOptions());
  }

  sendMessage(body: any) {
    return this.http.post<any>(`${this.baseUrl}/api/sendmessage`, body, this.getHttpOptions());
  }

  getContatos() {
    return this.http.get<any>(`${this.baseUrl}/api/getcontatos`, this.getHttpOptions());
  }

  getTurmas() {
    return this.http.get<any>(`${this.baseUrl}/api/getturmas`, this.getHttpOptions());
  }

  getMaterias() {
    return this.http.get<any>(`${this.baseUrl}/api/getmaterias`, this.getHttpOptions());
  }

  getAvaliacoes() {
    return this.http.get<any>(`${this.baseUrl}/api/getavaliacoes`, this.getHttpOptions());
  }
}
