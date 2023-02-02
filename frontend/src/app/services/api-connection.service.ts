import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
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
      `${this.baseUrl}/api/handleBot`,
      { conversationName: localStorage.getItem("sessionName"), order: "start" },
      this.httpOptions
    );
  }

  stopBot() {
    return this.http.post<any>(
      `${this.baseUrl}/api/handleBot`,
      { conversationName: localStorage.getItem("sessionName"), order: "stop" },
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

  clearLogs() {
    return this.http.get<any>(
      `${this.baseUrl}/api/controls/log/clear`,
      this.httpOptions
    );
  }

  getConversation() {
    return this.http.get<any>(`${this.baseUrl}/api/data`, this.httpOptions);
  }

  getConnection() {
    return this.http.get<any>(
      `${this.baseUrl}/api/connection`,
      this.httpOptions
    );
  }
}
