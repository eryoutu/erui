import React, { PureComponent, useContext, useCallback } from 'react';
import { getValue, setValue, getNamePath, defaultGetValueFromEvent } from '../../helpers/value';
import { FormContext } from './context';


export default class FormItem extends PureComponent {
  static contextType = FormContext;

  static defaultProps = {
    trigger: 'onChange',
    valuePropName: 'value',
  };

  // const onChange = () => {
  //   const { setFields, getFieldValue } = this.context;
  //   setFields({
  //     [name]: value,
  //   });
  // }
  constructor(props) {
    super(props);
    // const { getInternalHooks } = this.context;
    // const { initEntityValue } = getInternalHooks();
    // initEntityValue(this);
    this.mounted = false;
  }

  componentDidMount() {
      console.log('mounted---------------------')
    this.mounted = true;
      const { getInternalHooks } = this.context;
      const { registerField } = getInternalHooks();
      this.cancelRegisterFunc = registerField(this);
  }

  componentWillUnmount() {
    this.cancelRegister();
    this.mounted = false;
  }

  cancelRegister = () => {

    if (this.cancelRegisterFunc) {
      this.cancelRegisterFunc();
    }
    this.cancelRegisterFunc = null;
  };


  reRender = () => {
    if (!this.mounted) return;
    this.forceUpdate();
  }

  getNamePath = () => {
    const {name} = this.props;
    return getNamePath(name);
  };

  // public getRules = (): RuleObject[] => {
  //   const { rules = [] } = this.props;

  //   return rules.map(
  //     (rule: Rule): RuleObject => {
  //       if (typeof rule === 'function') {
  //         return rule(fieldContext);
  //       }
  //       return rule;
  //     },
  //   );
  // };

  // public validateRules = (options?: ValidateOptions): Promise<string[]> => {
  //   // We should fixed namePath & value to avoid developer change then by form function
  //   const namePath = this.getNamePath();
  //   const currentValue = this.getValue();

  //   // Force change to async to avoid rule OOD under renderProps field
  //   const rootPromise = Promise.resolve().then(() => {
  //     if (!this.mounted) {
  //       return [];
  //     }

  //     const { validateFirst = false, messageVariables } = this.props;
  //     const { triggerName } = (options || {}) as ValidateOptions;

  //     let filteredRules = this.getRules();
  //     if (triggerName) {
  //       filteredRules = filteredRules.filter((rule: RuleObject) => {
  //         const { validateTrigger } = rule;
  //         if (!validateTrigger) {
  //           return true;
  //         }
  //         const triggerList = toArray(validateTrigger);
  //         return triggerList.includes(triggerName);
  //       });
  //     }

  //     const promise = validateRules(namePath, currentValue, filteredRules, options, validateFirst, messageVariables);

  //     promise
  //       .catch((e) => e)
  //       .then((errors: string[] = []) => {
  //         if (this.validatePromise === rootPromise) {
  //           this.validatePromise = null;
  //           this.errors = errors;
  //           this.reRender();
  //         }
  //       });

  //     return promise;
  //   });

  //   this.validatePromise = rootPromise;
  //   this.dirty = true;
  //   this.errors = [];

  //   // Force trigger re-render since we need sync renderProps with new meta
  //   this.reRender();

  //   return rootPromise;
  // };

  getValue = () => {
    const { getFieldValue } = this.context;
    const namePath = this.getNamePath();
    return getFieldValue(namePath);
  };

  getControlled = (childProps = {}) => {
    const { trigger, validateTrigger, valuePropName } = this.props;


    const namePath = this.getNamePath();
    const {  setFieldValue } = this.context;

    const value = this.getValue();   //这里取到的是上一个值呀？有什么用呢？？
    const mergedGetValueProps = (val) => ({ [valuePropName]: val });

    const originTriggerFunc = childProps[trigger];

    const control = {
      ...childProps,
      ...mergedGetValueProps(value),
    };

    control[trigger] = (...args) => {
      // Mark as touched  干啥用？？
      this.touched = true;
      this.dirty = true;

      let newValue = defaultGetValueFromEvent(valuePropName, ...args);
      

      // dispatch({
      //   type: 'updateValue',
      //   namePath,
      //   value: newValue,
      // });

      setFieldValue(namePath, newValue)

      if (originTriggerFunc) {
        originTriggerFunc(...args);
      }
    };

    // // Add validateTrigger
    // const validateTriggerList: string[] = mergedValidateTrigger || [];

    // validateTriggerList.forEach((triggerName: string) => {
    //   // Wrap additional function of component, so that we can get latest value from store
    //   const originTrigger = control[triggerName];
    //   control[triggerName] = (...args: EventArgs) => {
    //     if (originTrigger) {
    //       originTrigger(...args);
    //     }

    //     // Always use latest rules
    //     const { rules } = this.props;
    //     if (rules && rules.length) {
    //       // We dispatch validate to root,
    //       // since it will update related data with other field with same name
    //       dispatch({
    //         type: 'validateField',
    //         namePath,
    //         triggerName,
    //       });
    //     }
    //   };
    // });

    return control;
  };

  validateRules = (options) => {
    // We should fixed namePath & value to avoid developer change then by form function
    const namePath = this.getNamePath();
    const currentValue = this.getValue();

    // Force change to async to avoid rule OOD under renderProps field
    const rootPromise = Promise.resolve().then(() => {
      if (!this.mounted) {
        return [];
      }

      const { validateFirst = false, messageVariables } = this.props;
      const { triggerName } = (options || {});

      let filteredRules = this.getRules();
      if (triggerName) {
        filteredRules = filteredRules.filter((rule) => {
          const { validateTrigger } = rule;
          if (!validateTrigger) {
            return true;
          }
          // const triggerList = toArray(validateTrigger);
          // return triggerList.includes(triggerName);
          return validateTrigger.includes(triggerName);
        });
      }

      const promise = validateRules(
        namePath,
        currentValue,
        filteredRules,
        options,
        validateFirst,
        messageVariables,
      );

      promise
        .catch(e => e)
        .then((errors = []) => {
          if (this.validatePromise === rootPromise) {
            this.validatePromise = null;
            this.errors = errors;
            this.reRender();
          }
        });

      return promise;
    });

    this.validatePromise = rootPromise;
    this.dirty = true;
    this.errors = [];

    // Force trigger re-render since we need sync renderProps with new meta
    this.reRender();

    return rootPromise;
  };

  render() {
    console.log('from item renderer--------------------')
    const { children, name } = this.props;

    // const error = <div>console.error</div>;

    const child = React.cloneElement(
      children,
      this.getControlled(children.props),
    );

    return (
      <div>
        {child}
        {/* {error} */}
      </div>
    );
  }
}
