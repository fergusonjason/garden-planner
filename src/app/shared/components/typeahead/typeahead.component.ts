import { Component, input, output, signal, computed } from '@angular/core';

export interface TypeaheadItem {
  name: string;
  value: string;
}

@Component({
  selector: 'gp-typeahead',
  standalone: true,
  templateUrl: './typeahead.component.html',
  styleUrl: './typeahead.component.css'
})
export class TypeaheadComponent {
  readonly dataFn = input.required<(query: string) => TypeaheadItem[]>();
  readonly placeholder = input('Search...');
  readonly minChars = input(3);

  readonly selected = output<TypeaheadItem>();

  readonly inputValue = signal('');
  readonly isOpen = signal(false);
  readonly activeIndex = signal(-1);
  private hasSelection = false;

  readonly suggestions = computed(() => {
    const val = this.inputValue();
    if (val.length < this.minChars()) return [];
    return this.dataFn()(val);
  });

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.hasSelection = false;
    this.inputValue.set(value);
    this.isOpen.set(value.length >= this.minChars());
    this.activeIndex.set(-1);
  }

  onFocus(input: HTMLInputElement): void {
    if (this.hasSelection) {
      input.select();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    const count = this.suggestions().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, count - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        break;
      case 'Enter': {
        const active = this.suggestions()[this.activeIndex()];
        if (active) {
          event.preventDefault();
          this.select(active);
        }
        break;
      }
      case 'Escape':
        this.close();
        break;
    }
  }

  onBlur(): void {
    setTimeout(() => this.close(), 150);
  }

  select(item: TypeaheadItem): void {
    this.inputValue.set(item.name);
    this.hasSelection = true;
    this.close();
    this.selected.emit(item);
  }

  private close(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }
}
