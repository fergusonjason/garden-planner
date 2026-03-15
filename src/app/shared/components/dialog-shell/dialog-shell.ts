import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ComponentRef,
  Type
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DialogAction {
  label: string;
  fn: () => void;
}

@Component({
  selector: 'app-dialog-shell',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop" [class.open]="visible" (click)="onBackdropClick($event)">
      <div class="dialog" #dialogEl role="dialog" [attr.aria-label]="title">

        <button *ngIf="showCloseIcon"
                class="modal-close"
                (click)="onClose?.()"
                aria-label="Close dialog">✕</button>

        <h3 *ngIf="title">{{ title }}</h3>

        <ng-container #contentSlot></ng-container>

        <div *ngIf="htmlContent"
             class="dialog-html-content"
             [innerHTML]="htmlContent">
        </div>

        <div class="dialog-actions" *ngIf="actions.length > 0">
          <button
            *ngFor="let action of actions"
            class="btn-action"
            (click)="action.fn()">
            {{ action.label }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class DialogShellComponent implements OnInit {

  @Input() title = '';
  @Input() htmlContent: string | null = null;

  @ViewChild('contentSlot', { read: ViewContainerRef, static: true })
  contentSlot!: ViewContainerRef;

  @ViewChild('dialogEl', { static: true })
  dialogEl!: ElementRef<HTMLElement>;

  actions: DialogAction[] = [];
  showCloseIcon = false;
  visible = false;

  private contentRef: ComponentRef<unknown> | null = null;

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      const firstBtn = this.el.nativeElement.querySelector('button');
      firstBtn?.focus();
    });
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.onClose?.();
    }
  }

  onClose?: () => void;

  show(): void {
    this.visible = true;
    this.cdr.markForCheck();
  }

  // ─── Content ────────────────────────────────────────────────────────────────

  setHtml(html: string): void {
    this.contentSlot.clear();
    this.contentRef  = null;
    this.htmlContent = html;
    this.cdr.markForCheck();
  }

  setComponent<T>(component: Type<T>, inputs?: Record<string, unknown>): void {
    this.contentSlot.clear();
    this.htmlContent = null;
    this.contentRef  = this.contentSlot.createComponent(component);
    if (inputs) {
      Object.entries(inputs).forEach(([key, value]) =>
        (this.contentRef as ComponentRef<T>).setInput(key, value)
      );
    }
    this.cdr.markForCheck();
  }

  setComponentInputs(inputs: Record<string, unknown>): void {
    if (!this.contentRef) return;
    Object.entries(inputs).forEach(([key, value]) =>
      this.contentRef!.setInput(key, value)
    );
    this.cdr.markForCheck();
  }

  // ─── Configuration ───────────────────────────────────────────────────────────

  addAction(label: string, fn: () => void): void {
    const wrappedFn = () => { fn(); this.onClose?.(); };
    this.actions = [...this.actions, { label, fn: wrappedFn }];
    this.cdr.markForCheck();
  }

  setTitle(title: string): void {
    this.title = title;
    this.cdr.markForCheck();
  }

  setCloseIcon(show: boolean): void {
    this.showCloseIcon = show;
    this.cdr.markForCheck();
  }

  setStyle(property: string, value: string): void {
    this.dialogEl.nativeElement.style.setProperty(property, value);
  }
}