import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConnectionService {

  baseUrl: string = '';

  constructor(
    private http: HttpClient,
  ) {
    this.baseUrl = environment.urlApi;
  }

  getQrCode() {
    return this.http.get<any>(`${this.baseUrl}/api/data`);
  }

  getStatus() {
    return this.http.get<any>(`${this.baseUrl}/api/connection`);
  }

  start() {
    return this.http.get<any>(`${this.baseUrl}/api/controls/start`);
  }

  stop() {
    return this.http.get<any>(`${this.baseUrl}/api/controls/stop`);
  }

  restart() {
    return this.http.get<any>(`${this.baseUrl}/api/controls/restart`);
  }
}
