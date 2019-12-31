import { Directive, ElementRef, Input, Output, EventEmitter, HostListener, forwardRef, Renderer2 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

export const CURRENCYDIRECTIVE_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MQCurrencyDirective),
    multi: true
};

/*
* - Format dễ nhìn theo config
* - Đồng nhất giữa giá trị hiển thị và giá trị trong model trừ trường hợp gán không hợp lệ.
* - Giữ nguyên các tính năng của ngModel
* Khi người dùng nhập thì ràng buộc theo config
* Khi Dev gán value cho model trực tiếp trong file ts, nếu là số thì cứ hiển thị đúng ra như vậy ngược lại để rỗng và giữ nguyên model không ràng buộc theo config
*/
@Directive({
    selector: '[MQCurrency]',
    providers: [CURRENCYDIRECTIVE_VALUE_ACCESSOR]
})
export class MQCurrencyDirective implements ControlValueAccessor {

    internalConfiguration: any;
    defaultConfiguration: any;
    mustUseConfiguration: any;
    displayedValue: any;
    modelValue: any;
    fallbackValue: any;
    @Input() configuration: any;
    @Input() maxValue: number;
    changeModelFn: Function;
    onTouchedFn: Function;
    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngOnInit() {
        if (!this.configuration) {
            this.configuration = {
                allowDecimal: true,
                allowNegative: false,
            };
        }
        this.defaultConfiguration = {
            align: 'right',
            allowDecimal: false,
            allowNegative: false,
            allowShortcutKey: true,
            decimal: '.',
            thousands: ',',
            maxLength: 12,
            maxValue: null,
            minValue: null,
            precision: 3,
            shortcutKeys: [
                { key: "m", value: 1000000 },
                { key: "h", value: 100000 },
                { key: "j", value: 10000 },
                { key: "k", value: 1000 },
                { key: "l", value: 100 }
            ]
        };
        this.mustUseConfiguration = {
            precision: 0,
            allowZero: true
        };
        this.internalConfiguration = Object.assign({}, this.defaultConfiguration, this.configuration, this.mustUseConfiguration);
        this.el.nativeElement.style.textAlign = this.internalConfiguration.align;
        if(this.maxValue === undefined) this.maxValue = null;
    }

    writeValue(value) {
        this.modelValue = value;
        if (!this.isValidNumber(value)) {
            this.handleInvalidNumber();
        }
        else {
            this.handleValidNumber(value);
        }
    }

    registerOnChange(fn) {
        this.changeModelFn = fn;
    }

    registerOnTouched(fn) { 
        this.onTouchedFn = fn;
    }

    setDisabledState(isDisabled) {
        this.setDisabledStateInUI(isDisabled);
    }

    @HostListener('input', ['$event.target.value'])
    inputEventHandler(displayedValue) {
        if (!this.internalConfiguration.allowDecimal) {
            this.handleIntegerNumber(displayedValue);
        }
        else {
            this.handleDecimalNumber(displayedValue);
        }
    }

    @HostListener('blur', ['$event'])
    blurEventHandler($event){
        //this.onTouchedFn($event);
        this.onTouchedFn();
    }

    handleIntegerNumber(displayedValue) {
        let justPressedShortcutKeys = this.justPressedKey(displayedValue, this.getRegExpConditionForShortcutKeys());
        let pressedShortcutKey = null;
        let refinedValue = displayedValue;
        if (justPressedShortcutKeys.isRight) {
            pressedShortcutKey = justPressedShortcutKeys.key;
            refinedValue = displayedValue.replace(new RegExp(pressedShortcutKey, "g"), "");
        }
        refinedValue = this.formatToValidate(refinedValue);
        if (this.isValidNumberFormat(refinedValue)) {
            let startSelectionPosition = this.el.nativeElement.selectionStart;
            let endSelectionPosition = this.el.nativeElement.selectionEnd;
            let beforeLength = displayedValue.length;
            if (this.internalConfiguration.allowShortcutKey) refinedValue = this.handleShortcutKey(refinedValue, pressedShortcutKey);
            let pureNumber = this.parseNumber(refinedValue);
            this.fallbackValue = pureNumber;
            this.modelValue = pureNumber;
            this.changeModelFn(pureNumber);
            let numberString = this.formatNumberToDisplayOnUI(pureNumber);
            this.displayedValue = numberString;
            this.showValueInUI();
            this.handleSelectionPositionInInput(startSelectionPosition, endSelectionPosition, beforeLength, numberString.length);
        }
        else {
            let startSelectionPosition = this.el.nativeElement.selectionStart;
            let endSelectionPosition = this.el.nativeElement.selectionEnd;
            this.handleInputInvalidFormat();
            this.handleSelectionPositionInInput(startSelectionPosition, endSelectionPosition, 1, 0);
        }
    }

    handleDecimalNumber(displayedValue) {
        let justPressedShortcutKeys = this.justPressedKey(displayedValue, this.getRegExpConditionForShortcutKeys());
        let pressedShortcutKey = null;
        let refinedValue = displayedValue;
        if (justPressedShortcutKeys.isRight) {
            pressedShortcutKey = justPressedShortcutKeys.key;
            refinedValue = displayedValue.replace(new RegExp(pressedShortcutKey, "g"), "");
        }
        let isNeedToAddDecimalSign = this.justPressedKey(refinedValue, ".").isRight;
        refinedValue = this.formatToValidate(refinedValue);
        if (this.isValidNumberFormat(refinedValue)) {
            let startSelectionPosition = this.el.nativeElement.selectionStart;
            let endSelectionPosition = this.el.nativeElement.selectionEnd;
            let beforeLength = displayedValue.length;
            if (this.internalConfiguration.allowShortcutKey) refinedValue = this.handleShortcutKey(refinedValue, pressedShortcutKey);
            this.setDecimalPrecision(refinedValue);
            let pureNumber = this.parseNumber(refinedValue);
            this.fallbackValue = pureNumber;
            this.modelValue = pureNumber;
            this.changeModelFn(pureNumber);
            let numberString = this.formatNumberToDisplayOnUI(pureNumber);
            if (isNeedToAddDecimalSign) numberString += ".";
            this.displayedValue = numberString;
            this.showValueInUI();
            this.handleSelectionPositionInInput(startSelectionPosition, endSelectionPosition, beforeLength, numberString.length);
        }
        else {
            let startSelectionPosition = this.el.nativeElement.selectionStart;
            let endSelectionPosition = this.el.nativeElement.selectionEnd;
            this.handleInputInvalidFormat();
            this.handleSelectionPositionInInput(startSelectionPosition, endSelectionPosition, 1, 0);
        }
    }

    handleInputInvalidFormat() {
        let numberString = this.formatNumberToDisplayOnUI(this.fallbackValue);
        this.displayedValue = numberString;
        this.modelValue = this.fallbackValue;
        this.changeModelFn(this.fallbackValue);
        this.showValueInUI();
    }

    handleSelectionPositionInInput(startSelectionPosition, endSelectionPosition, beforeLength, afterLength) {
        let differenceValue = afterLength - beforeLength;
        // let startPosition = differenceValue > 0 ? (startSelectionPosition + differenceValue) : startSelectionPosition;
        // let endPosition = differenceValue > 0 ? (endSelectionPosition + differenceValue) : endSelectionPosition;
        let startPosition = startSelectionPosition + differenceValue;
        let endPosition = endSelectionPosition + differenceValue;
        if (this.el.nativeElement.setSelectionRange && typeof this.el.nativeElement.setSelectionRange === "function") {
            if(startPosition >= 0 && endPosition > 0){
                this.el.nativeElement.setSelectionRange(startPosition, endPosition);
            }
            else{
                this.el.nativeElement.setSelectionRange(1, 1);
            }
        }
    }

    handleShortcutKey(input, pressedShortcutKey) {
        if (pressedShortcutKey !== null) {
            let shortcutKeys = this.internalConfiguration.shortcutKeys;
            for (let shortcutKey of shortcutKeys) {
                let pressedShortcutKeyRegExp = this.createRegExpCondition(shortcutKey.key);
                if (pressedShortcutKeyRegExp === pressedShortcutKey) {
                    if (this.isValidNumber(shortcutKey.value)) {
                        let numberWithShortcut = input * shortcutKey.value;
                        let intergralNumber = Math.floor(numberWithShortcut);
                        if (intergralNumber.toString().length <= this.internalConfiguration.maxLength){
                            if(this.maxValue !== null){
                                if(numberWithShortcut <= this.internalConfiguration.maxValue){
                                    input = numberWithShortcut;
                                }
                            }
                            else{
                                input = numberWithShortcut;
                            }
                        }
                        break;
                    }
                }
            }
        }
        return input.toString();;
    }

    isValidNumberFormat(str) {
        if (isNaN(str)) {
            return false;
        }
        if (!this.internalConfiguration.allowNegative && str[0] === "-") {
            return false;
        }
        let splitStr = str.split(".")
        let maxPrecisionLength = this.configuration.precision ? this.configuration.precision : this.defaultConfiguration.precision;
        if (this.internalConfiguration.allowDecimal && splitStr.length > 1
            && splitStr[1].length > maxPrecisionLength) {
            return false;
        }
        let number = parseFloat(str);
        if (this.maxValue !== null) {
            if (number > this.maxValue) {
                return false;
            }
        }
        if (this.internalConfiguration.minValue !== null) {
            if (number < this.internalConfiguration.minValue) {
                return false;
            }
        }
        number = Math.floor(Math.abs(parseFloat(str)));
        if (number.toString().length > this.internalConfiguration.maxLength) {
            return false;
        }
        return true;
    }

    parseNumber(input) {
        if (typeof input === "string") {
            return !this.internalConfiguration.allowDecimal ? parseInt(input) : parseFloat(input);
        }
        else {
            return input;
        }
    }

    isValidNumber(input) {
        return (typeof input !== "number" || isNaN(input)) ? false: true;
    }

    formatToValidate(str) {
        str = str.replace(new RegExp(this.internalConfiguration.thousands, "g"), "");
        if (this.internalConfiguration.allowDecimal) {
            str = str.replace(this.internalConfiguration.decimal, ".");
        }
        return str !== "" && str.trim() !== "" ? str : "0";
    }

    justPressedKey(str, key) {
        let result = { isRight: false, key: null }
        if (key !== ".") {
            if ((new RegExp(`(${key})$`)).test(str)) {
                result.isRight = true;
                result.key = this.createRegExpCondition(str[str.length - 1]);
            }
        }
        else {
            if (str[str.length - 1] === ".") {
                result.isRight = true;
                result.key = '.';
            }
        }
        return result;
    }

    createRegExpCondition(key) {
        return `${key.toLowerCase()}|${key.toUpperCase()}`;
    }

    getRegExpConditionForShortcutKeys() {
        let shortcutKeys = this.internalConfiguration.shortcutKeys;
        let arr = this.internalConfiguration.shortcutKeys.map((shortcutKey)=>{ return this.createRegExpCondition(shortcutKey.key); });
        return arr.join("|");
    }

    getDecimalPartLength(input) {
        if (typeof input === "number") {
            input = input.toString();
        }
        let splitStr = input.split(".");
        if (splitStr.length === 2) {
            return splitStr[1].length;
        }
        else {
            return 0;
        }
    }

    setDecimalPrecision(str) {
        this.internalConfiguration.precision = Math.min(
            this.getDecimalPartLength(str),
            this.configuration.precision ? this.configuration.precision : this.defaultConfiguration.precision
        );
    }

    handleInvalidNumber() {
        this.displayedValue = '';
        this.fallbackValue = 0;
        this.showValueInUI();
    }

    showValueInUI() {
        this.renderer.setProperty(this.el.nativeElement, 'value', this.displayedValue);
    }

    setDisabledStateInUI(isDisabled){
        this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
    }

    handleValidNumber(number) {
        let config = this.getConfigurationForWriteValue(number);
        let formattedNumber = this.formatNumberToDisplayOnUI(number, config);
        this.fallbackValue = this.isValidNumberFormat(number.toString()) ? number: 0;
        this.displayedValue = formattedNumber;
        this.showValueInUI();
    }

    getConfigurationForWriteValue(number) {
        let precision = this.getDecimalPartLength(number);
        return { allowNegative: true, decimal: ".", precision, thousands: ',' };
    }

    formatNumberToDisplayOnUI(number: number, config?: any): string {
        let { allowNegative, decimal, precision, thousands } = config ? config : this.internalConfiguration;
        let rawValue = new Number(number).toFixed(precision);
        let onlyNumbers = rawValue.replace(/[^0-9]/g, "");

        if (!onlyNumbers) { return ""; }

        let integerPart = onlyNumbers.slice(0, onlyNumbers.length - precision).replace(/^0*/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, thousands);

        if (integerPart == "") { integerPart = "0"; }

        let newRawValue = integerPart;
        let decimalPart = onlyNumbers.slice(onlyNumbers.length - precision);

        if (precision > 0) { newRawValue += decimal + decimalPart; }

        let isZero = parseInt(integerPart) == 0 && (parseInt(decimalPart) == 0 || decimalPart == "");
        let operator = (rawValue.indexOf("-") > -1 && allowNegative && !isZero) ? "-" : "";
        return `${operator}${newRawValue}`;
    }
}
