import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faHome, faUserFriends, faPoll, faTools, faDoorOpen } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  menuSelecionado: string;
  faHome = faHome;
  faUserFriends = faUserFriends;
  faPoll = faPoll;
  faTools = faTools;
  faDoorOpen = faDoorOpen;
  
  constructor(private router: Router) {
    this.menuSelecionado = 'pagina-inicial';
  }

  ngOnInit(): void {
    this.menuSelecionado = this.router.url.replace('/', '');
  }

  navigateTo(menu: string) {
    console.log('menu: ', menu);
    this.menuSelecionado = menu;
    if (menu !== 'sair') {
      this.router.navigate([`/${menu}`]);
    }
  }

}
