import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { SelectionModel } from "@angular/cdk/collections";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ApiConnectionService } from "app/services/api-connection.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalComponent } from "app/components/modal/modal.component";

@Component({
  selector: "app-contatos",
  templateUrl: "./contatos.component.html",
  styleUrls: ["./contatos.component.css"],
})
export class ContatosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ["select", "telefone", "aluno_nome", "materia_nome", "avaliacao_nome", "nota", "turma_nome"];
  dataSource = new MatTableDataSource<any>([]);
  originalDataSource = this.dataSource.data;
  selection = new SelectionModel<any>(true, []);
  turmas: any[] = [];
  materias: any[] = [];
  avaliacoes: any[] = [];
  selectedTurma: any = null;
  selectedAvaliacao: any = null;
  selectedMateria: any = null;
  loading: boolean = true;
  selectedCount: number = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private service: ApiConnectionService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loading = true;
    Promise.all([this.getContatos(), this.getTurmas(), this.getMaterias(), this.getAvaliacoes()])
      .then(() => {
        this.loading = false;
      })
      .catch((error) => {
        console.error("Erro ao carregar dados:", error);
        this.loading = false;
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async getContatos() {
    const res = await this.service.getContatos().toPromise();
    this.dataSource.data = res;
    this.originalDataSource = res;
  }

  async getTurmas() {
    const res = await this.service.getTurmas().toPromise();
    this.turmas = res;
  }

  async getMaterias() {
    const res = await this.service.getMaterias().toPromise();
    this.materias = res;
  }

  async getAvaliacoes() {
    const res = await this.service.getAvaliacoes().toPromise();
    this.avaliacoes = res;
  }

  applyFilters() {
    let filteredData = [...this.originalDataSource];

    if (this.selectedTurma) {
      filteredData = filteredData.filter((item) => item.turma_nome === this.selectedTurma.turma_nome);
    }

    if (this.selectedAvaliacao) {
      filteredData = filteredData.filter((item) => item.avaliacao_nome === this.selectedAvaliacao.avaliacao_nome);
    }

    if (this.selectedMateria) {
      filteredData = filteredData.filter((item) => item.materia_nome === this.selectedMateria.materia_nome);
    }

    this.dataSource.data = filteredData;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  enviarSelecionados() {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: "450px",
      data: { text: "Você enviará apenas para os contatos selecionados.", showConfirm: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let telefones = [];
        const selecionados = this.selection.selected;
        selecionados.forEach((element) => {
          telefones.push(element.telefone);
        });

        const body = { emMassa: false, telefones: telefones };
        this.service.sendMessage(body).subscribe((res) => {});
      }
    });
  }

  enviarEmMassa() {
    this.dataSource.data.forEach((element) => {
      const body = { telefone: element.telefone, aluno: element.aluno, materia: element.materia, nota: element.nota };
      this.service.sendMessage(body).subscribe((res) => {
        console.log(`Enviado: ${element.telefone}`);
      });
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? "select" : "deselect"} all`;
    }
    return `${this.selection.isSelected(row) ? "deselect" : "select"} row ${row.position + 1}`;
  }

  toggleSelection(element: any) {
    this.selection.toggle(element);
    this.selectedCount = this.selection.selected.length;
  }
}
