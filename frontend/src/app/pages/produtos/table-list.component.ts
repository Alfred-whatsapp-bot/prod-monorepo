import { Component, OnInit, Inject } from "@angular/core";
import { ApiConnectionService } from "../../services/api-connection.service";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ModalComponent } from "app/components/modal/modal.component";

export interface Message {
  text: string;
  message_id: number;
}

@Component({
  selector: "app-table-list",
  templateUrl: "./table-list.component.html",
  styleUrls: ["./table-list.component.scss"],
})
export class TableListComponent implements OnInit {
  data: Message[] = [];

  constructor(
    private service: ApiConnectionService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.service.getMessage().subscribe((data: Message[]) => {
      this.data = data;
    });
  }

  displayedColumns: string[] = ["message", "actions"];

  editRow(row: Message) {
    // Logic to edit the row goes here
    const dialogRef = this.dialog.open(ModalComponent, {
      width: "400px",
      data: { text: row.text, messageId: row.message_id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        row.text = result.text;
        row.message_id = result.messageId;
      }
    });
  }

  deleteRow(row: Message) {
    // Logic to delete the row goes here
  }

  newMessage() {
    // Logic to create a new message goes here
  }
}
