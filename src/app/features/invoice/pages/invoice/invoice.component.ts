import { PopupModalComponent } from "./../../../../shared/components/popup-modal/popup-modal.component";
import { InvoiceService } from "./../../services/invoice.service";
import { NgxSpinnerService } from "ngx-spinner";
import { FormatDate } from "./../../../../core/constants/format-date";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog, MatTableDataSource } from "@angular/material";
import { ActivatedRoute, Router } from "@angular/router";
import { Customer } from "src/app/core/models/customer";
import { finalize, map, tap } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";
import { observable, Observable, Subscription } from "rxjs";

@Component({
  selector: "app-invoice",
  templateUrl: "./invoice.component.html",
  styleUrls: ["./invoice.component.scss"],
})
export class InvoiceComponent implements OnInit, OnDestroy {
  /* props */
  invoiceDetails$: Observable<any>;
  invoiceDetails: any;
  clientDetails: any;
  amountList: number[] = [];

  formatDate = new FormatDate();
  clientListTable: Customer[] = [];
  invoiceListDataSource$: Observable<any>;
  clientListTableDataSource = new MatTableDataSource(this.clientListTable);
  displayedColumns: string[] = [
    "name",
    "address",
    "mobile",
    "purposeOfVisit",
    "action",
  ];

  visitDetailId: number;
  visitMainId: number;
  totalAmount: number;

  orgDetail = {
    organization: "Aama Dental Care Clinic Pvt Ltd",
  };
  client: Customer;

  subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private invoiceService: InvoiceService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchInvoiceDetails();
  }
  fetchQueryParmValues() {
    /* for add */
    this.route.queryParamMap.subscribe((params) => {
      this.visitMainId = +params.get("visitMainId");
      this.visitDetailId = +params.get("visitDetailId");
    }),
      (err) => {
        err = err.error.message
          ? this.toastr.error(err.error.message)
          : this.toastr.error("Error fetching param value.");
        this.spinner.hide();
      };
  }

  fetchInvoiceDetails() {
    /* START FROM HERE  claculate total */
    this.spinner.show();
    this.fetchQueryParmValues();
    this.invoiceService
      .getInvoiceDetails(this.visitDetailId, this.visitMainId)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe((res: any) => {
        this.clientDetails = res.customer;
        this.invoiceDetails = res.form;
        let amountList = res.form.itemList.map((f: any) => f.amount);
        this.calculateTotalAmount(amountList);
      }),
      (err) => {
        err = err.error.message
          ? this.toastr.error(err.error.message)
          : this.toastr.error("Error fetching  visit main form values.");
        this.spinner.hide();
      };
  }

  onSearch(e) {
    // date lai format garera backend api call garne
    /* test */
    this.spinner.show();
    if (e.status === "V") {
      // this.isVerified = true;
      (this.invoiceListDataSource$ = this.invoiceService
        .searchInvoices(
          e.status,
          this.formatDate.getFormatDate(e.fromDate),
          this.formatDate.getFormatDate(e.toDate)
        )
        .pipe(finalize(() => this.spinner.hide()))),
        (err) => {
          this.toastr.error(err.message);
        };
      this.invoiceListDataSource$.subscribe((res) => {});
    } else {
      // this.isVerified = false;

      (this.invoiceListDataSource$ = this.invoiceService
        .searchInvoices(
          e.status,
          this.formatDate.getFormatDate(e.fromDate),
          this.formatDate.getFormatDate(e.toDate)
        )
        .pipe(finalize(() => this.spinner.hide()))),
        (err) => {
          this.toastr.error(err.message);
        };
      this.invoiceListDataSource$.subscribe((res) => {});
    }
    /* test end */
  }

  onPrintStatusCheck() {
    const dialogRef = this.dialog.open(PopupModalComponent, {
      disableClose: true,
      width: "450px",
      data: {
        title: "",
        message: "Was the print successful?",
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      result === "yes" ? this.savePrint() : null;
    });
  }
  savePrint() {}

  calculateTotalAmount(amount: number[]) {
    return (this.totalAmount = amount.reduce((a, c) => a + c));
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
