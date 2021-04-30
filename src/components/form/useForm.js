import { useRef, useState } from 'react';
import { getValue, setValue, setValues } from '../../helpers/value';
import { allPromiseFinish } from '../../helpers/validate';

class FormStore {
  store = {};
  initialValues = {};
  fieldEntities = [];


  constructor(forceRootUpdate) {
    this.forceRootUpdate = forceRootUpdate;
  }

  getForm = () => ({
    getFieldValue: this.getFieldValue,
    setFieldValue: this.setFieldValue,
    validateFields: this.validateFields,
    submit: this.submit,
    getInternalHooks: this.getInternalHooks,
  });

  getInternalHooks = () => ({
    setInitialValues: this.setInitialValues,
    registerField: this.registerField,
  });

  // 保存初始值 + 为store赋值初始值
  setInitialValues = (initialValues) => {
    this.initialValues = initialValues || {};
    this.store = setValues({}, initialValues, this.store);
    console.log('setInitialValues--------',this.store, initialValues)
  };

  registerField = (entity) => {
    this.fieldEntities.push(entity);

    // un-register field callback
    // 注销
    // isListField, preserve 这两个参数有啥用？？先不管吧。
    return () => {
      this.fieldEntities = this.fieldEntities.filter(item => item !== entity);

        const namePath = entity.getNamePath();
        if (namePath.length && this.getFieldValue(namePath) !== undefined) {
          this.store = setValue(this.store, namePath, undefined);
        }
    };
  };

  /**
   * Get registered field entities.
   * @param pure Only return field which has a `name`. Default: false
   */
  getFieldEntities = (pure = false) => {
    if (!pure) {
      return this.fieldEntities;
    }

    return this.fieldEntities.filter(field => field.getNamePath().length);
  };

  notify = (
    namePathList,
    prevStore,
    info,
  ) => {
    // this.forceRootUpdate();
    this.getFieldEntities().forEach(({ reRender }) => {
      reRender();
    });
  };

  setFieldValue = (paths, value) => {
    this.store = setValue(this.store, paths, value)
    this.notify()
  };

  getFieldValue = (paths) => {
    if(paths===true) {
      return this.store
    }
    return getValue(this.store, paths)
  };

  validateFields = (
    nameList,
    options,
  ) => {
    this.warningUnhooked();

    const provideNameList = !!nameList;
    const namePathList = provideNameList
    //   ? nameList.map(getNamePath)
    //   : [];

    // // Collect result in promise list
    const promiseList = [];

    this.getFieldEntities(true).forEach((field) => {
      
      // Skip if without rule
      if (!field.props.rules || !field.props.rules.length) {
        return;
      }

      const fieldNamePath = field.getNamePath();
      // Add field validate rule in to promise list
        const promise = field.validateRules({
          validateMessages: {
            // ...defaultValidateMessages,
            ...this.validateMessages,
          },
          ...options,
        });

        // Wrap promise with field
        promiseList.push(
          promise
            .then(() => ({ name: fieldNamePath, errors: [] }))
            .catch(errors =>
              Promise.reject({
                name: fieldNamePath,
                errors,
              }),
            ),
        );
    });


    // 用promise.all？？？？这样无法得到所有的错误？

    const summaryPromise = allPromiseFinish(promiseList);
    this.lastValidatePromise = summaryPromise;

    // Notify fields with rule that validate has finished and need update
    summaryPromise
      .catch(results => results)
      .then((results) => {
        // const resultNamePathList = results.map(({ name }) => name);
        // this.notifyObservers(this.store, resultNamePathList, {
        //   type: 'validateFinish',
        // });
        // this.triggerOnFieldsChange(resultNamePathList, results);
      });

    // 这个returnPromise是干啥的？？？
    const returnPromise = summaryPromise
      .then(
        () => {
          if (this.lastValidatePromise === summaryPromise) {
            return Promise.resolve(this.getFieldValue(namePathList));
          }
          return Promise.reject([]);
        },
      )
      .catch((results) => {
        const errorList = results.filter(result => result && result.errors.length);
        return Promise.reject({
          values: this.getFieldValue(namePathList),
          errorFields: errorList,
          outOfDate: this.lastValidatePromise !== summaryPromise,
        });
      });

    // Do not throw in console
    returnPromise.catch(e => e);

    return returnPromise;
  };

  submit = () => {
    console.log('submit', this.store)
    this.validateFields()
      .then(values => {
        // const { onFinish } = this.callbacks;
        // if (onFinish) {
        //   try {
        //     onFinish(values);
        //   } catch (err) {
        //     // Should print error if user `onFinish` callback failed
        //     console.error(err);
        //   }
        // }
      })
      .catch(e => {
        // const { onFinishFailed } = this.callbacks;
        // if (onFinishFailed) {
        //   onFinishFailed(e);
        // }
      });
  }
}

export function useForm() {
  const formRef = useRef();
  const [, forceUpdate] = useState(Object.create(null));
  if (!formRef.current) {
    const forceReRender = () => {
      forceUpdate(Object.create(null));
    };
    const formStore = new FormStore(forceReRender);
    formRef.current = formStore.getForm();
  }
  return [formRef.current];
}