import { Component, OnDestroy } from '@angular/core';
import { SpeakService } from '../services/speak.service';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Subject, of, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-speak-text',
    templateUrl: './speak-text.component.html',
    styleUrls: ['./speak-text.component.scss']
})
export class SpeakTextComponent implements OnDestroy {

    form: FormGroup;
    destroy$: Subject<any>;
    spokenTimes: number;
    isSpeaking: boolean;

    constructor(private speakTextService: SpeakService) {
        const formGroups = [];
        this.spokenTimes = 0;
        this.isSpeaking = false;
        this.destroy$ = new Subject<any>();
        for (let x = 0; x < 3; x++) {
            formGroups.push(this.generateFormGroup());
        }
        this.form = new FormGroup({
            sentences: new FormArray(formGroups)
        });
    }

    generateFormGroup(text = null, breakTime = 0, times = 5, isInfinityLoop = false) {
        const formGroup = new FormGroup({
            text: new FormControl(text, [Validators.required]),
            breakTime: new FormControl(breakTime, [Validators.required]),
            times: new FormControl(times, [Validators.required]),
            isInfinityLoop: new FormControl(isInfinityLoop, [Validators.required])
        });

        formGroup.controls.isInfinityLoop.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(isInfinity => {
            const action = isInfinity || this.isSpeaking ? 'disable' : 'enable';
            formGroup.controls.times[action]({ emitEvent: false });
        });
        return formGroup;
    }

    speakText(index) {
        if (!this.speakTextService.isSpeaking()) {
            const eachSentenceFormGroup = this.sentencesFormArray.controls[index] as FormGroup;
            const textFormControl = eachSentenceFormGroup.controls.text;
            const breakTimeFormControl = eachSentenceFormGroup.controls.breakTime;
            const timesFormControl = eachSentenceFormGroup.controls.times;
            const isInfinityLoopFormControl = eachSentenceFormGroup.controls.isInfinityLoop;
            const isInfinityLoop = isInfinityLoopFormControl.value;
            const times = timesFormControl.value;
            const timeNeedToLoop = !isInfinityLoop ? times : 99999;
            const isTextValid = textFormControl.valid;
            if (isTextValid) {
                const text = textFormControl.value;
                this.isSpeaking = true;
                this.toggleDisabledStatusOfFormGroupsExceptTheOne(true);
                for (let x = 0; x < timeNeedToLoop; x++) {
                    this.speakTextService.speak(text, () => {
                        this.spokenTimes++;
                        if (this.spokenTimes === timeNeedToLoop) {
                            this.isSpeaking = false;
                            this.spokenTimes = 0;
                            this.toggleDisabledStatusOfFormGroupsExceptTheOne(false);
                        }
                    });
                }
            }
        }
    }

    toggleDisabledStatusOfFormGroupsExceptTheOne(needToDisable = false) {
        for (let x = 0; x < this.sentencesFormArray.controls.length; x++) {
            const sentenceFormGroup = this.sentencesFormArray.controls[x];
            const action = needToDisable ? 'disable' : 'enable';
            sentenceFormGroup[action]();
        }
    }

    stopSpeaking() {
        this.isSpeaking = false;
        this.spokenTimes = 0;
        this.toggleDisabledStatusOfFormGroupsExceptTheOne(false);
        this.speakTextService.stopSpeaking();
    }

    removeText(index) {
        this.sentencesFormArray.removeAt(index);
    }

    addSentence() {
        this.sentencesFormArray.push(this.generateFormGroup());
    }

    get sentencesFormArray() {
        return this.form.controls.sentences as FormArray;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
