import { HttpClient, HttpClientCommonOptions, HttpRequestOptions } from "@angular/common/http";
import { inject } from "@angular/core";
import { Observable, OperatorFunction, switchMap } from "rxjs";

type GetOptions = Omit<HttpClientCommonOptions, 'observe' | 'responseType'>;

export abstract class AbstractServiceDirective{

    private readonly http = inject(HttpClient);

    public get$<T>(options?: GetOptions): OperatorFunction<string, T> {
    return switchMap((url: string) =>
      this.http.get<T>(url, {
        ...options,
        observe: 'body',
        responseType: 'json',
      })
    );
  }

}