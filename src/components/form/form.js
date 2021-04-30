import React, { useImperativeHandle, forwardRef, useMemo, useEffect } from 'react';
import { FormContext } from './context';
import { useForm } from './useForm';

const Form = (props, ref) => {
  console.log('from renderer--------------------')
  const { initialValues, rules, onFinish, onFinishFailed, children } = props;

  const [formInstance] = useForm();

  const { setInitialValues } = formInstance.getInternalHooks();

  // // 初始化数据
  // useEffect(() => {
  //   setInitialValues(initialValues);

  //   setRules(rules);

  //   setCallbacks({
  //     onFinish,
  //     onFinishFailed,
  //   });
  // }, []);

  // 初始化数据
  // Set initial value, init store value when first mount
  const mountRef = React.useRef(null);
  if (!mountRef.current) {
    console.log('setInitialValues----------')
    setInitialValues(initialValues);
    mountRef.current = true;
  }

  // 暴露方法
  useImperativeHandle(ref, () => formInstance);

  const formContextValue = useMemo(
    () => ({
      ...formInstance,
    }),
    [formInstance],
  );

  console.log('from renderer----')

  return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          formInstance.submit();
        }}
      >
        <FormContext.Provider value={formContextValue}>
            {children}
        </FormContext.Provider>
      </form>
  );
};

export default forwardRef(Form);
