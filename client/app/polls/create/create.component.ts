import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { PollsService } from '../../core/polls.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {

  pollForm: FormGroup;

  constructor(private fb: FormBuilder,
              private polls: PollsService,
              private router: Router,
              private toastr: ToastsManager,
              private vcr: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vcr);
  }

  ngOnInit() {
    this.pollForm = this.fb.group({
      name: ['', Validators.required],
      options: this.fb.array(this.initOptions())
    });
  }

  addOption() {
    const optionsControl = <FormArray>this.pollForm.controls['options'];
    optionsControl.push(this.fb.group({value: ['', Validators.required]}));
  }

  getOptionName(i) {
    return `Option ${i + 1}`;
  }

  initOptions() {
    return [
      this.fb.group({value: ['À rejeter', Validators.required]}),
      this.fb.group({value: ['Insuffisant', Validators.required]}),
      this.fb.group({value: ['Passable', Validators.required]}),
      this.fb.group({value: ['Assez bien', Validators.required]}),
      this.fb.group({value: ['Bien', Validators.required]}),
      this.fb.group({value: ['Très bien', Validators.required]}),
      this.fb.group({value: ['Excellent', Validators.required]})
    ];
  }

  removeOption(i) {
    const optionsControl = <FormArray>this.pollForm.controls['options'];
    optionsControl.removeAt(i);
  }

  submit(poll) {
    this.polls.create(poll).subscribe((data: any) => {
      this.router.navigate([`/polls/${data._id}`]);
    }, (error) => {
      this.toastr.error(error);
    });
  }

}
