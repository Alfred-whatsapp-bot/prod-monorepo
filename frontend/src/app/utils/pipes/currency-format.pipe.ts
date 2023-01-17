import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {
    transform(value: string,
        currencySign: string = 'R$ ',
        decimalLength: number = 2,
        chunkDelimiter: string = '.',
        decimalDelimiter: string = ',',
        chunkLength: number = 3): string {

        let result = '\\d(?=(\\d{' + chunkLength + '})+' + (decimalLength > 0 ? '\\D' : '$') + ')';

        return currencySign + (decimalDelimiter ? value.replace('.', decimalDelimiter) : value).replace(new RegExp(result, 'g'), '$&' + chunkDelimiter);
    }
}