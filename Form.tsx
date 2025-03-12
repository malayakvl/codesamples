import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { useTranslations } from 'next-intl';
import { Formik, FormikProps, useFormikContext } from 'formik';
import { InputHidden, InputSwitcher, InputText } from '../_form';
import { useDispatch, useSelector } from 'react-redux';
import ReactTags from 'react-tag-autocomplete';
import Select, { StylesConfig } from 'react-select';
import chroma from 'chroma-js';
import { prepareAdditionalDropdown } from '../../lib/functions';
import { prepareConfigValues, prepareAdditionalColorDropdown } from '../../lib/inventoryServices';
import {
    getIdentSelector,
    productAdditionalSelector,
    selectedAdditionalsSelector,
    tagSuggestionsSelector,
    uploadedFilesSelector
} from '../../redux/products/selectors';
import { findTagAction, setIdentAction, updateProductAction } from '../../redux/products/actions';
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';
import { InventoryPhotos, RenderSizes, RenderVariant } from './index';

const SunEditor = dynamic(() => import('suneditor-react'), {
    ssr: false
});

export interface ColourOption {
    readonly value: string;
    readonly label: string;
    readonly color: string;
    readonly isFixed?: boolean;
    readonly isDisabled?: boolean;
}

/**
 * Get color styles for product color dropdown
 *
 */
const colourStyles: StylesConfig<ColourOption, true> = {
    control: (styles) => ({ ...styles, backgroundColor: 'white' }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        const color = chroma(data.color);
        return {
            ...styles,
            backgroundColor: isDisabled
                ? undefined
                : isSelected
                ? data.color
                : isFocused
                ? color.alpha(0.1).css()
                : undefined,
            color: isDisabled
                ? '#ccc'
                : isSelected
                ? chroma.contrast(color, 'white') > 2
                    ? 'white'
                    : 'black'
                : data.color,
            cursor: isDisabled ? 'not-allowed' : 'default',

            ':active': {
                ...styles[':active'],
                backgroundColor: !isDisabled
                    ? isSelected
                        ? data.color
                        : color.alpha(0.3).css()
                    : undefined
            }
        };
    },
    multiValue: (styles, { data }) => {
        const color = chroma(data.color);
        return {
            ...styles,
            backgroundColor: color.alpha(0.1).css()
        };
    },
    multiValueLabel: (styles, { data }) => ({
        ...styles,
        color: data.color
    }),
    multiValueRemove: (styles, { data }) => ({
        ...styles,
        color: data.color,
        ':hover': {
            backgroundColor: data.color,
            color: 'white'
        }
    })
};

/**
 * Product form
 *
 * @param locale - string
 * @param productData - object
 * @param photos - object
 * @param publish - boolean
 * @constructor
 */
function ProductForm({
    locale,
    productData,
    photos,
    publish
}: {
    locale: string;
    productData: Products.Product;
    photos: string[];
    publish: boolean;
}) {
    const t = useTranslations();
    const dispatch = useDispatch();
    const additionalProps = useSelector(productAdditionalSelector);
    const additionalSelectedProps = useSelector(selectedAdditionalsSelector);
    const searchTagSuggestions = useSelector(tagSuggestionsSelector);
    const uploadedFiles = useSelector(uploadedFilesSelector);
    const isIdent = useSelector(getIdentSelector);
    const performedSizes = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];

    const [editorContent, setEditorContent] = useState('');
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState<any[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<any>(null);
    const [tags, setTags] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isBusy, setIsBusy] = useState(false);
    const [showSizeTable, setShowSizeTable] = useState(false);
    const [errorConfigured, setErrorConfigured] = useState<any[]>([]);
    const [active, setActive] = useState(false);
    const [x, setX] = useState(publish);
    const dataVariants: {
        price: string | null;
        qty: string | null;
        sku: string;
        color_id: number | null;
        size_id: number | null;
    }[] = [];
    const [showError, setShowError] = useState(false);

    const formRef = React.useRef<FormikProps<any>>(null);

    const onDelete = useCallback(
        (tagIndex: number) => {
            setTags(tags.filter((_, i) => i !== tagIndex));
        },
        [tags]
    );

    useEffect(() => {
        setX(productData.product.publish);
    }, [productData.product]);

    const onAddition = useCallback(
        (newTag) => {
            setTags([...tags, newTag]);
        },
        [tags]
    );

    const onInput = (query: string) => {
        if (!isBusy) {
            setIsBusy(true);
            dispatch(findTagAction(query));
        }
    };
    useEffect(() => {
        setSuggestions(searchTagSuggestions);
        setIsBusy(false);
    }, [searchTagSuggestions]);

    useEffect(() => {
        setSelectedSizes(additionalSelectedProps.sizes);
        setSelectedColors(additionalSelectedProps.colors);
        setSelectedMaterials(additionalSelectedProps.materials);
        setTags(additionalSelectedProps.tags);
        setEditorContent('');
    }, [additionalSelectedProps]);

    const handleChangeEditor = (content: any) => {
        setEditorContent(content);
    };
    const handleChangeMaterials = (selectedOption: any) => {
        setSelectedMaterials(selectedOption);
    };

    const handleChangeColor = (selectedOption: any) => {
        const formValues = formRef?.current?.values;
        setSelectedColors(selectedOption);
        if (selectedOption?.length > 0) {
            selectedOption.forEach(function (_color: any) {
                selectedSizes.forEach(function (_size: any) {
                    formRef.current?.setFieldValue(
                        `configurePrice_${_color.label}_${_size.label}`,
                        formValues[`configurePrice_${_color.label}_${_size.label}`]
                            ? formValues[`configurePrice_${_color.label}_${_size.label}`]
                            : ''
                    );
                    formRef.current?.setFieldValue(
                        `configureQty_${_color.label}_${_size.label}`,
                        formValues[`configureQty_${_color.label}_${_size.label}`]
                            ? formValues[`configureQty_${_color.label}_${_size.label}`]
                            : ''
                    );

                    formRef.current?.setFieldValue(
                        `configureSKU_${_color.label}_${_size.label}`,
                        formValues[`configureSKU_${_color.label}_${_size.label}`]
                            ? formValues[`configureSKU_${_color.label}_${_size.label}`]
                            : ''
                    );
                });
            });
        }
    };

    const handleChangeSize = (selectedOption: any, configured: boolean) => {
        if (!configured) {
            setSelectedSizes(selectedOption);
        } else {
            const _sizes: any = selectedSizes;
            if (!_sizes.find((v: any) => v.value === selectedOption.value)) {
                setSelectedSizes([...selectedSizes, selectedOption]);
            }
            const formValues = formRef?.current?.values;
            selectedColors.forEach(function (_color: any) {
                selectedSizes.forEach(function (_size: any) {
                    formRef.current?.setFieldValue(
                        `configurePrice_${_color.label}_${_size.label}`,
                        formValues[`configurePrice_${_color.label}_${_size.label}`]
                            ? formValues[`configurePrice_${_color.label}_${_size.label}`]
                            : ''
                    );
                    formRef.current?.setFieldValue(
                        `configureQty_${_color.label}_${_size.label}`,
                        formValues[`configureQty_${_color.label}_${_size.label}`]
                            ? formValues[`configureQty_${_color.label}_${_size.label}`]
                            : ''
                    );
                    formRef.current?.setFieldValue(
                        `configureSKU_${_color.label}_${_size.label}`,
                        formValues[`configureSKU_${_color.label}_${_size.label}`]
                            ? formValues[`configureSKU_${_color.label}_${_size.label}`]
                            : ''
                    );
                });
            });
        }
        showSizeHandler();
    };
    const removeSizeHandler = (id: number) => {
        setSelectedSizes(selectedSizes.filter((v: any) => v.value !== id));
    };
    const clearSizeHandler = () => {
        setSelectedSizes([]);
    };

    const [, set] = useState();
    const showSizeHandler = () => {
        setShowSizeTable(!showSizeTable);
    };

    const SubmitSchema = Yup.object().shape({
        name: Yup.string()
            .max(140, t('Must be less characters', { charNumber: 140 }))
            .required(t('Required field')),
        price: Yup.number().when('configured', {
            is: false,
            then: Yup.number().required(t('Required field')).min(0)
        }),
        quantity: Yup.number().when('configured', {
            is: false,
            then: Yup.number().required(t('Required field')).min(0)
        }),
        color: Yup.string().when('configured', {
            is: true,
            then:
                selectedSizes?.length === 0 && selectedColors?.length === 0
                    ? Yup.string().required(t('Select color or size'))
                    : Yup.string()
        }),
        size: Yup.string().when('configured', {
            is: true,
            then:
                selectedSizes?.length === 0 && selectedColors?.length === 0
                    ? Yup.string().required(t('Select color or size'))
                    : Yup.string()
        })
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return (
        <Formik
            enableReinitialize
            initialValues={productData.product}
            validationSchema={SubmitSchema}
            innerRef={formRef}
            onSubmit={(values) => {
                dispatch(setIdentAction(false));
                let errorConfig = false;
                const tmpError: any[] = [];
                setErrorConfigured([]);
                if (values['configured']) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const tmpVariant = document.getElementById('props_variants').textContent;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    let tmpValues: any[] = [];
                    if (tmpVariant) {
                        tmpValues = JSON.parse(tmpVariant);
                    }
                    if (selectedSizes.length === 0 && selectedColors.length === 0) {
                        setShowError(true);
                        errorConfig = true;
                    } else {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        // const tmpValues = JSON.parse(tmpVariant);
                        if (selectedColors.length > 0 && selectedSizes.length > 0) {
                            selectedColors.forEach((_color: any) => {
                                selectedSizes.forEach((_size: any) => {
                                    const _tmpSizeLabel = _size['label'].replace('.', '_');
                                    let tPrice = '';
                                    let tQty = '';
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    tPrice = document.getElementById(
                                        `tconfigurePrice_${_color['label']}_${_tmpSizeLabel}`
                                    ).textContent;
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    tQty = document.getElementById(
                                        `tconfigureQty_${_color['label']}_${_tmpSizeLabel}`
                                    ).textContent;
                                    if (tmpValues.length > 0) {
                                        tmpValues.forEach((_value: any) => {
                                            if (
                                                _value.color_id == _color['label'] &&
                                                _value.size_id.replace('.', '_')
                                            ) {
                                                tPrice = _value.price;
                                                tQty = _value.qty;
                                            }
                                        });
                                    }
                                    dataVariants.push({
                                        price: tPrice,
                                        qty: tQty,
                                        sku: '',
                                        color_id: _color['value'],
                                        size_id: _size['value']
                                    });
                                    if (!tPrice || !tQty) {
                                        errorConfig = true;
                                        tmpError.push(`error_${_color['label']}_${_size['label']}`);
                                    }
                                });
                            });
                        }
                        if (selectedColors.length > 0 && selectedSizes.length == 0) {
                            selectedColors.forEach((_color: any) => {
                                let tPrice = '';
                                let tQty = '';
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                tPrice = document.getElementById(
                                    `tconfigurePrice_${_color['label']}_none`
                                ).textContent;
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                tQty = document.getElementById(
                                    `tconfigureQty_${_color['label']}_none`
                                ).textContent;
                                dataVariants.push({
                                    price: tPrice,
                                    qty: tQty,
                                    sku: '',
                                    color_id: _color['value'],
                                    size_id: null
                                });
                            });
                        }
                        if (selectedColors.length == 0 && selectedSizes.length > 0) {
                            selectedSizes.forEach((_size: any) => {
                                let tPrice = '';
                                let tQty = '';
                                const _tmpSizeLabel = _size['label'].replace('.', '_');
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                tPrice = document.getElementById(
                                    `tconfigurePrice_none_${_tmpSizeLabel}`
                                ).textContent;
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                tQty = document.getElementById(
                                    `tconfigureQty_none_${_tmpSizeLabel}`
                                ).textContent;
                                dataVariants.push({
                                    price: tPrice,
                                    qty: tQty,
                                    sku: '',
                                    color_id: null,
                                    size_id: _size['value']
                                });
                            });
                        }
                    }
                } else {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const tColor = selectedColors?.value || selectedColors?.value || null;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const tSize = selectedSizes?.value || selectedSizes?.value || null;
                    dataVariants.push({
                        price: values['price'],
                        qty: values['quantity'],
                        sku: values['sku'],
                        color_id: tColor,
                        size_id: tSize
                    });
                }
                if (tmpError.length > 0) {
                    setErrorConfigured(tmpError);
                }

                if (!isIdent && !errorConfig) {
                    const formData = new FormData();
                    Object.keys(values).forEach((key: string) => {
                        if (!['material_id', 'tags', 'description', publish].includes(key)) {
                            formData.append(key, (values as any)[key]);
                        }
                    });
                    formData.append('description', editorContent);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    formData.append('isPublish', x);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    if (active === 'true') {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        formData.append('publishCheckbox', 1);
                    } else {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        formData.append('publishCheckbox', 0);
                    }
                    formData.append('description', '');
                    formData.append('tags', JSON.stringify(tags));
                    formData.append('configurations', JSON.stringify(dataVariants));
                    formData.append('materials', JSON.stringify(selectedMaterials));
                    formData.append('colors', JSON.stringify(selectedColors));
                    formData.append('sizes', JSON.stringify(selectedSizes));
                    formData.append(
                        'material_id',
                        (selectedMaterials as any)?.length
                            ? (selectedMaterials[0] as any).value
                            : (selectedMaterials as any).value || null
                    );
                    if (uploadedFiles.length) {
                        uploadedFiles.forEach((file: any) => {
                            formData.append('photos[]', file);
                        });
                    }
                    dispatch(updateProductAction(formData, values.id));
                }
            }}>
            {(props) => {
                const { handleChange } = props;
                const onChangeConfigured = (e: any) => {
                    setSelectedColors([]);
                    setSelectedSizes([]);
                    return handleChange(e);
                };
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return (
                    <form onSubmit={props.handleSubmit} className="mt-5">
                        <div
                            className="max-w-screen-md xl:max-w-screen-2xl xl:grid xl:grid-cols-2"
                            style={{ paddingBottom: '100px' }}>
                            <div className="flex-col mb-4">
                                <InventoryPhotos
                                    uploadedFiles={uploadedFiles}
                                    photos={photos}
                                    productData={productData}
                                />
                            </div>
                            <div className="xl:ml-4">
                                <h2 className="form-subtitle">{t('Product details')}</h2>
                                <InputText
                                    icon={null}
                                    label={'Product Name'}
                                    name={'name'}
                                    placeholder={'Product Name'}
                                    style={null}
                                    props={props}
                                    tips={t('count_characters', { charNumber: 140 })}
                                    onChange={(event) => {
                                        event.target.value = event.target.value.trimStart();
                                        props.handleChange(event);
                                    }}
                                />
                                <div className="mb-4">
                                    <label className="control-label" htmlFor={'description'}>
                                        {t('Product Description')}
                                    </label>
                                    <SunEditor
                                        name={'description'}
                                        setDefaultStyle="font-family: Montserrat; font-size: 14px;"
                                        placeholder={t('Product Description')}
                                        defaultValue={props.values.description || editorContent}
                                        setContents={props.values.description}
                                        setOptions={{ height: '250' }}
                                        onChange={handleChangeEditor}
                                    />
                                    {editorContent.replace(/(&nbsp;|<([^>]+)>)/gi, '').length ===
                                        0 && (
                                        <div className="error-el">
                                            {props.errors['description']}
                                        </div>
                                    )}
                                </div>

                                <InputSwitcher
                                    label={'Configured'}
                                    name={'configured'}
                                    style={null}
                                    props={props}
                                    onChange={onChangeConfigured}
                                />

                                <div className="mb-4">
                                    <label className="control-label">{t('Hashtag')}</label>
                                    <div className="relative">
                                        <em className="input-tips">{t('Select one')}</em>
                                        <ReactTags
                                            tags={tags}
                                            allowNew={true}
                                            suggestions={suggestions}
                                            onDelete={onDelete}
                                            onAddition={onAddition}
                                            onInput={onInput}
                                        />
                                    </div>
                                </div>

                                {!props.values.configured && (
                                    <>
                                        <InputText
                                            icon={null}
                                            label={'SKU'}
                                            name={'sku'}
                                            placeholder={'SKU'}
                                            style={null}
                                            props={props}
                                            tips={t('count_characters', { charNumber: 5 })}
                                            onChange={(event) => {
                                                event.target.value = event.target.value.trimStart();
                                                props.handleChange(event);
                                            }}
                                        />

                                        <InputText
                                            icon={null}
                                            label={'Product Price'}
                                            name={'price'}
                                            placeholder={'Product Price'}
                                            style={null}
                                            props={props}
                                            tips={t('Select one')}
                                        />

                                        <InputText
                                            icon={null}
                                            label={'Quantity'}
                                            name={'quantity'}
                                            placeholder={'Quantity'}
                                            style={null}
                                            props={props}
                                            tips={t('Select one')}
                                            onChange={(event) => {
                                                let num = Math.round(+event.target.value);
                                                num = Math.abs(num);
                                                if (!Number.isInteger(num)) num = 0;
                                                event.target.value = String(num);
                                                props.handleChange(event);
                                            }}
                                        />
                                    </>
                                )}
                                <div className="mb-4">
                                    <label className="control-label">{t('Material')}</label>
                                    <div className="relative">
                                        <em className="input-tips">{t('Select one')}</em>
                                        <Select
                                            isClearable={true}
                                            className={'form-control-dropdown'}
                                            classNamePrefix={'inventory'}
                                            options={prepareAdditionalDropdown(
                                                additionalProps.materials,
                                                locale
                                            )}
                                            value={selectedMaterials}
                                            onChange={handleChangeMaterials}
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="control-label">{t('Color')}</label>
                                    <div className="relative">
                                        <em className="input-tips">{t('Select one')}</em>
                                        <Select
                                            isMulti={props.values.configured}
                                            isClearable={true}
                                            className={'form-control-dropdown'}
                                            classNamePrefix={'inventory-color'}
                                            options={prepareAdditionalColorDropdown(
                                                additionalProps.colors,
                                                locale
                                            )}
                                            value={selectedColors}
                                            styles={colourStyles}
                                            onChange={handleChangeColor}
                                        />
                                        {props.errors['color'] &&
                                            selectedColors.length === 0 &&
                                            selectedSizes.length === 0 && (
                                                <div className="error-el">
                                                    {props.errors['color']}
                                                </div>
                                            )}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="control-label">{t('Size')}</label>
                                    <div className="relative">
                                        <em
                                            className="input-tips underline"
                                            role="presentation"
                                        >
                                            {t('Select one')}
                                        </em>
                                        {
                                            <RenderSizes
                                                sizes={selectedSizes}
                                                configured={props.values.configured}
                                                removeSizeHandler={removeSizeHandler}
                                                showSizeHandler={showSizeHandler}
                                                clearSizeHandler={clearSizeHandler}
                                            />
                                        }
                                        {showSizeTable && (
                                            <table className="text-[10px] absolute bg-white left-0 top-[40px] z-50">
                                                <tbody>
                                                    {additionalProps.sizesTable.map(
                                                        (size: any, index: number) => (
                                                            <tr key={index}>
                                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                                                    (num: number) => (
                                                                        <Fragment
                                                                            key={`${size.id}_${num}`}>
                                                                            {size[
                                                                                `name_${num}`
                                                                            ] && (
                                                                                <td
                                                                                    role="presentation"
                                                                                    className="border p-2 cursor-pointer"
                                                                                    onClick={() =>
                                                                                        handleChangeSize(
                                                                                            {
                                                                                                value: size[
                                                                                                    `id_${num}`
                                                                                                ],
                                                                                                label: size[
                                                                                                    `name_${num}`
                                                                                                ]
                                                                                            },
                                                                                            props
                                                                                                .values
                                                                                                .configured
                                                                                        )
                                                                                    }>
                                                                                    {performedSizes.includes(
                                                                                        size[
                                                                                            `name_${num}`
                                                                                        ]
                                                                                    )
                                                                                        ? size[
                                                                                              `name_${num}`
                                                                                          ].replace(
                                                                                              's',
                                                                                              ''
                                                                                          )
                                                                                        : size[
                                                                                              `name_${num}`
                                                                                          ]}
                                                                                </td>
                                                                            )}
                                                                            {!size[
                                                                                `name_${num}`
                                                                            ] && (
                                                                                <td className="border p-2" />
                                                                            )}
                                                                        </Fragment>
                                                                    )
                                                                )}
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                        {props.errors['size'] &&
                                            selectedColors.length === 0 &&
                                            selectedSizes.length === 0 && (
                                                <div className="error-el">
                                                    {props.errors['size']}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {props.values.configured && (
                                    <>
                                        <RenderVariant
                                            colors={selectedColors}
                                            sizes={selectedSizes}
                                            props={props}
                                            additional={additionalProps}
                                            errors={errorConfigured}
                                            locale={locale}
                                        />
                                    </>
                                )}
                                <div className="mb-4">
                                    <label className="control-label">{t('Active')}</label>
                                    <input type="checkbox" checked={x} onChange={() => setX(!x)} />
                                    {/*<input type="checkbox" checked={x} onChange={soldCheckbox}/>*/}
                                </div>

                                <button type="submit" className="gradient-btn">
                                    {props.values.id ? t('Update Product') : t('Add a Product')}
                                </button>
                            </div>
                        </div>
                        <section className={showError ? `modal` : 'hidden'}>
                            <article className="modal-content p-lg-4">
                                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
                                <div
                                    className="varianModalClose"
                                    onClick={() => setShowError(false)}>
                                    X
                                </div>
                                <main className="modal-mainContents">
                                    <p className="p-3 ">
                                        {t('You need to chose at least one colour and size')}
                                    </p>
                                </main>
                            </article>
                        </section>
                    </form>
                );
            }}
        </Formik>
    );
}

export default ProductForm;
