import { Component, OnDestroy } from '@angular/core';
import { SpeakService } from '../services/speak.service';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-clone-text',
    templateUrl: './clone-text.component.html',
    styleUrls: ['./clone-text.component.scss']
})
export class CloneTextComponent implements OnDestroy {

    form: FormGroup;
    destroy$: Subject<any>;

    constructor() {
        this.form = new FormGroup({
            text: new FormControl(null, [Validators.required]),
            times: new FormControl(1, [Validators.required]),
            result: new FormControl(null, [])
        });
    }

    clone(): void {
        const text = this.form.controls['text'].value;
        if(!!text) {
            const times = this.form.controls['times'].value;
            let ar = [];
            ar.length = Number.parseInt(times);
            ar.fill(text);
            const result = ar.join(" ");
            this.form.controls["result"].patchValue(result, { emitEvent: false });
        }
    }

    clear(): void {
        this.form.reset({
            text: null,
            times: 1,
            result: null
        });
    }

    copyToClipboard(): void {
        const result = this.form.controls["result"].value || "";
        const resultEl = document.getElementById('result') as any;
        resultEl.select();
        resultEl.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(result);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
