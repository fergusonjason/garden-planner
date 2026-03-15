import {
  Injectable,
  ViewContainerRef,
  ComponentRef,
  Type,
  SecurityContext,
  isDevMode
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DialogShellComponent } from '../components/dialog-shell/dialog-shell';
@Injectable({ providedIn: 'root' })
export class DialogService {

  private vcr: ViewContainerRef | null = null;
  private shellRef: ComponentRef<DialogShellComponent> | null = null;
  private keyListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  // ─── Container registration ──────────────────────────────────────────────────

  /**
   * Call once from AppComponent's ngAfterViewInit.
   *
   *   @ViewChild('dialogContainer', { read: ViewContainerRef })
   *   dialogContainer!: ViewContainerRef;
   *
   *   ngAfterViewInit() {
   *     this.dialogService.setContainer(this.dialogContainer);
   *   }
   */
  setContainer(vcr: ViewContainerRef): void {
    this.vcr = vcr;
  }

  // ─── Core API ────────────────────────────────────────────────────────────────

  /**
   * Create the dialog shell and begin building it.
   * Call open() at the end of the chain to display it.
   *
   *   this.dialogService
   *     .createDialog()
   *     .setTitle('Confirm')
   *     .setDialogContent('<p>Are you sure?</p>')
   *     .addAction('OK', () => {})
   *     .open();
   */
  createDialog(): this {
    if (!this.vcr) {
      if (isDevMode()) {
        console.warn(
          '[DialogService] No container set. Call dialogService.setContainer(vcr) ' +
          'from AppComponent\'s ngAfterViewInit before using createDialog().'
        );
      }
      return this;
    }

    this.closeDialog();

    this.shellRef = this.vcr.createComponent(DialogShellComponent);
    this.shellRef.instance.onClose = () => this.closeDialog();
    this.shellRef.changeDetectorRef.detectChanges();

    return this;
  }

  /**
   * Display the dialog. Should be the last call in the builder chain.
   */
  open(): this {
    if (!this.shellRef) return this;

    this.shellRef.instance.show();
    this.shellRef.changeDetectorRef.detectChanges();

    this.keyListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.closeDialog();
    };
    document.addEventListener('keydown', this.keyListener);

    return this;
  }

  closeDialog(): void {
    if (this.shellRef) {
      this.shellRef.destroy();
      this.shellRef = null;
    }
    if (this.keyListener) {
      document.removeEventListener('keydown', this.keyListener);
      this.keyListener = null;
    }
  }

  // ─── Content ─────────────────────────────────────────────────────────────────

  /**
   * Set dialog content to a sanitized HTML string.
   */
  setDialogContent(content: string): this;

  /**
   * Set dialog content to a dynamically created component.
   * @param component  The component class to project.
   * @param inputs     Optional map of input property names to values.
   */
  setDialogContent<T>(component: Type<T>, inputs?: Record<string, unknown>): this;

  setDialogContent<T>(
    content: string | Type<T>,
    inputs?: Record<string, unknown>
  ): this {
    if (!this.shellRef) return this;

    if (typeof content === 'string') {
      const safe = this.sanitizer.sanitize(SecurityContext.HTML, content) ?? '';
      this.shellRef.instance.setHtml(safe);
    } else {
      this.shellRef.instance.setComponent(content, inputs);
    }

    this.shellRef.changeDetectorRef.detectChanges();
    return this;
  }

  /**
   * Update inputs on the currently projected component without replacing it.
   */
  setComponentInputs(inputs: Record<string, unknown>): this {
    this.shellRef?.instance.setComponentInputs(inputs);
    return this;
  }

  // ─── Dialog configuration ────────────────────────────────────────────────────

  setTitle(title: string): this {
    this.shellRef?.instance.setTitle(title);
    return this;
  }

  addAction(label: string, fn: () => void = () => {}): this {
    this.shellRef?.instance.addAction(label, fn);
    return this;
  }

  showCloseIcon(show = true): this {
    this.shellRef?.instance.setCloseIcon(show);
    return this;
  }

  // ─── Sizing ──────────────────────────────────────────────────────────────────

  setWidth(value: number | string): this {
    return this.applyStyle('width', value);
  }

  setMinWidth(value: number | string): this {
    return this.applyStyle('min-width', value);
  }

  setMaxWidth(value: number | string): this {
    return this.applyStyle('max-width', value);
  }

  setHeight(value: number | string): this {
    return this.applyStyle('height', value);
  }

  setMinHeight(value: number | string): this {
    return this.applyStyle('min-height', value);
  }

  setMaxHeight(value: number | string): this {
    return this.applyStyle('max-height', value);
  }

  /**
   * Make the dialog resizable by the user.
   * Accepts true | false, or a CSS resize value ('both' | 'horizontal' | 'vertical' | 'none').
   */
  setResizable(value: boolean | 'both' | 'horizontal' | 'vertical' | 'none'): this {
    const cssValue = typeof value === 'boolean' ? (value ? 'both' : 'none') : value;
    if (cssValue !== 'none') {
      this.shellRef?.instance.setStyle('overflow', 'auto');
    }
    return this.applyStyle('resize', cssValue);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  get isOpen(): boolean {
    return this.shellRef !== null && this.shellRef.instance.visible;
  }

  private applyStyle(property: string, value: number | string): this {
    this.shellRef?.instance.setStyle(
      property,
      typeof value === 'number' ? `${value}px` : value
    );
    return this;
  }
}