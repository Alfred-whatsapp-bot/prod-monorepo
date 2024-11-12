import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateMensagemComponent } from './template-mensagem.component';

describe('TemplateMensagemComponent', () => {
  let component: TemplateMensagemComponent;
  let fixture: ComponentFixture<TemplateMensagemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemplateMensagemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateMensagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
