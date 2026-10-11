import { Injectable } from "@angular/core";
import { AbstractServiceDirective } from "../../../core/services/abstract-service.directive";
import { Observable, of } from "rxjs";
import { PhotosResponse } from "../types/photos-response.type";

@Injectable()
export class PhotosService extends AbstractServiceDirective{
    
    public index$(url: string): Observable<PhotosResponse[]>{
        return of(url).pipe(this.get$({params:{limit:9}}));
    }
}