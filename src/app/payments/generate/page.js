"use client"
import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const initialRows = [
// (sin ejemplo inicial)
];

export default function PaymentsPage() {
	// ...existing code...
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");
       const handlePrint = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const columns = ["Empresa", "Fecha", "Concepto", "Importe", "Banco", "Tipo", "Tipo Comprobancion", "Estatus"];
    const rowsData = rows.map(row => [
        row.empresa,
        row.fecha,
        row.subconcepto 
            ? { content: row.concepto + '\n' + row.subconcepto }
            : row.concepto,
        `$${parseFloat(row.importe).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        row.banco,
        row.tipo,
        row.tipoComprobancion,
        row.estatus
    ]);
    // Título y fecha
    doc.setFontSize(18);
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = "MOVIMIENTOS";
    doc.text(title, pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    const fechaActual = new Date().toLocaleString();
    const fechaText = `Generado: ${fechaActual}`;
    doc.text(fechaText, pageWidth / 2, 30, { align: "center" });
    try {
        const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKsAAABFCAYAAAA1phbrAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABzNSURBVHgB7V0LcFxXef7/+1jJdozXEwghQH3dUjAliaUhhIRCvQqPhJJiaaDQdhgsQUJIC6NVZ2g604JW7dAOtIzklpKHMyMpQMujxTIpTQIBbRIaJxmK5PIKoYmueZlxSLyOY1va+zj9z/Peu1o5u4qcSM79Nav7Oufc13e/8z/OA+EZlsq/HfJs1+3qcO0ttmN1Oa7lubblOQ6C49qezZeOBVHIIAiiWhhEfhDGtSAI/Xo9PBjHUF2oPTlbGdhag1yeU4JwmqU8Pld0A7vXLbg7bBtKHJAcjARSAUqXfjZfujbo/bbNwRpxsNIvhpCv1yMI+XYYi2VYj2bDIJ4Nw/q+T17zsinI5YyX0wbWD47+pOQ6zrBjE3sWrKIEpq2AKYFqOzZzHURHAJUzqq3AigRQCUoB1kACN9mnwEvbQT3kS2LeeCoKFyZv+MgFVcjljJQVBWt/ZaZoFdYPWo5VJsYsyqpdsiZnS7EuACuqfMGqaZYVYFVMG0UxIyCiAikjFiWQ0nadlmFE2xEqMKfWBfP6YRRVbvno9knI5YySFQFrb3mmuP55hUECYZkAV3QaQCjBinLpoKnybVcxqwIp7WeUDg1YBYOGyIFaDyIWESgDzaYCmIwJlUCsC9UAAwFqsc+PgrjypU9elIP2DBELnqa84yMHBp319hxjrELYL8q9TP1QrJDQqvwukP6YPEhHGco1mYfSIYnYw8Qx+vEctKZWeCJa8C3kCdQhkR0hu+JR4oneofvmrvzQPSXIZc3Lspn1ivJ+z4WOcWLEktE5XVOVM/qhU7CZQ0zJdVSun1IalOxqEaNamNZfJRMrxiWVgRtVRlflVX0Y4XoH4F2v2wib1tstX2ffn9+vdNt4bGEhGKlO9ORehDUqy2LWt1z7nV1W6M7QaonDnSk6Q4F9QaaK7eRSEKtgQcmqKCgXxUEU7Ct+Yl1uc+JEljolxpTvda9Y1xZQZU5UPM7KaOHMJf3THuSyJqVtsF521f2jjMUTVMUWNS+LqpiJqlulQlUXY6qSl5W+AKoCL0i0ggY3r/qpXOTlMAV0fYLzX1zAV720A9oWpqAqvyevEMUzl77r9jLksubEaTVhqX+6GEFhL730EmiUSSAo/Ak9MqWYKoZFi4EhXQ5GnQckJceUxs5qI5jZRNjYaeFrX9YJyxPxAagLEIUXwbJHL37nNzY98O9vHoFc1oy0xKxdvdPFhcCdJvyVlCFkGFHhLzF0lF4AaIhT2kNM7jGGkkoq11Hjn5kyQB9j8IaXd8DRkxHcNnOc/eTQArQvqC0+xf4cvlGlq/e2YchlzchTgpUD1e2wpukFd2naNKqpxB0m1b5kxQwzKtVAkHBKbWDCstcFMgNxmYXpFSRWhdmf1uE/7j8O3//5AszXGbQn8mNi8mNKMvO1OKqc//u35oBdI/KUYEUHpum9dimrR+6T/1niSxDaKNOky7SeqN1QJlmqXK6TYqIVMOXGQn0aFKorHJuP4RdHIpWfLcN7IfMktC8NOpact/KKy/fmOuwakFOC9cK3T4/SO+1KrHZTm4Iw3Fma5YQhr7RWhtoNoOlSKQDGx6p8pogS9ExsY4LntM/VIDTrIWhTUBpZoibI1gYQw+jLSntLkMuqliXB+sor7xyMIUoxTgOrabd+BrCoNi0m1VbpvNeeAO22kvlp1RIMp4Cd9vkK1DPNtgkzt49VSfWSSY3dJ84or0idm/Aaj3ul8SLksmqlKVi3XXGbF8uIVPaAAqjiSglLq8GSlwlRK4g6yoSCRbMFSjutKVuiqfKFn/RpEKqs+dNEnyoPwVA3Y15UXz8Ouaxaaeq6imJrmgJJRUwCmIn7yTAsk557Zqz5lEIr06MKlzJEzWEGrOeTz5S3A7AoWmUT4JF8/Q6tc/Bb9AlFEdLPFsvDNQaHjsSQ+kha1l3NV8OMgyIT4QWpPusye1908b/2HnrgT/Imh6tQFoH1ty67rZ8WHl9n0j+v3FKW9tOr129AK7eZjunz/zFt2LoGl6BF7Z4HeP22dfCG31kPp5aE9O9/GAisAXfKYsZKa0VSybUKrRDL6BTmHowHg8F4sWu8WpsdyMOyq0wyasC5Jar+AYYTq8Y0RtFqpGQhbS2pA9q40tm0rgra+lYZ+damDXYLQF1CcBnOgLSzV96S1KuNAislNp8SFB1wcu/AKpQMWAtxvIvepCdVOGkMGT+qdgKghoxyX2pWYklCDmiho2q1QbupKPV7S5tgOaJabi1LeZXRWxNvSFg09cEpfUWHLgaJXXNja5WJAeu5l+z16HX2p95k2oOOKZ8qGJ9rYriYdUnBArnMGGTKTVW6YAMUiVl/+mgA80F7uBPXFcdtUyvTjjJUAYysuw0yDW/QeB+KEFo5u64yMWC1LbvELWKp2KlIP6DSRc0SEpaVJKr0A1AtqmQmwayJPsiBuvWFBeC/z1aPss9/+xhbaAOswh9g2sQ+HXaVzKm8EGo/NvHJCcQOQi6rSgxYY4bDfJmY/RwUMULqXSZRIBmykgmFkz2xngB0CDZjs88dDmD8zsfh4OF6++yYFMYW+XufQozKAjoYIHdIdQWUOm2CxyYXZ9ezto2XIJdVIwKsz7+IR2+IVSFlwyBLoU2+5DiJ5iNTYUvOqhrg2iUquamBAEUiK9Ec2xXUhN+esKwOY+JnoG8j5XZLPjmmXK8wDLmsGhFgJZD1Q6PL3rSsUmqACaWmqU17AJSCypKdJrFqbwV6S6+0KyyLueWIacGonW/ySrTLLduAVu7sKnq5obVaRKkBuF1by8pBnhKW1KQKh/LFmgbTADqUmWYxQ6EqnKr+KRAsF3bL0FdTl8RYCqOp4zLmm+2aIBfFEzbbAbmsCnGKXXs9ejNdstpDphudLvZpLo4cnbO5g21/+VloO7L3KkWfkEejLIevy/7/ar/oV/XQL+so2k+1CVU0kVvZy6BtMW43VAag6mOTNG9MdVxUTQp1AIHFPbTc16xYx9tToq+dwIyePE18lAqbCv2rq5mExM4uBLvoSXTpdMQTM4F/1STftr2beyleR+8AjwT+B3ans3Z613shWP3ifBBPRGD1Cm9FE6HyvcC/ul+Xx/fRW5it+1dlInLp4/Rm5vR1LHmdENwF/rU+LCH8OdADpDIt4ZeMITpI+aqLnkMLeemcswFE+5qdz7HtqIsxRznOpbGU5S/V2krpsKbeJ7mq98V4yQWt+00nvlVjP/t1sDwDC41/oV2oM61jq+aLUlllRn3BROWRNYFYJkpHU2Z1vT2jtChTEKVGCafkdeJ2Wh90vZt92qxwEND6LgbhmLr4VDrG01UICD0R2FUX2DgdmqVfBqzz/Fxgcd15aN6/xne9GwnUFpUJ1cVXpewOYHRNljKY2Zg+r3kiwLbr4zHEA2InfRQE1Gkmeyir64QtCPFOlyBleTcOLfjXjC31HChflZa+3GvtoLsdpmOz9PF0QzMR53P4PZfSeWm9n/aPgbenGoDTB34SSXSITbuMS0C6p3BRbYvKYa6NEXoCb99xTltAleWnVYr2hS23PWtGJWEyOAymiZgkbN3CS7UT0MzKYtbFGSfz0Lw9/EWXqYwRehmV9NkkE9qjof+BSf5CqMQJSje7AZyeWqoMno5AOu2CO02B5G5ilN0cQJxp0oxEL47KR9+GYCpInYfS9Cy61Qb9mgOazl2mMveZMum8tI/KZL6uEcQ9CfZGit6F3fMNrEago3uNp5qfL+TH6DlcU2l8DjG4XbCEuHTvqoboaWRg17uJ8tH1+NmQt0MB8u1KHVUdTrk9lA5saa+AaklFb/Hcswt4zTteCssVbDdsKikRkxBu29lV63BxdvVPWIzScyuicFnPR3Kx9PBY4AWS9dQu1k8P06fqtdJ4LvWi+/i6BBpVuxD21fyra43piCWJRdkoAbE3hMKYC+GgRYwLmjUF2GEX/SbmT1ENy3SdtcaXS2+SPgDRw4OzX3dyTUhlsRHaHE/dJs9bjMAdtr2b7qKH7XOGJrWEs+NYsOTJocbA3kUAO0LnO8B3hODMzvsDdA7NtFnhHyS/ajrHBNU+1cbj/Jxk2FYaG2dYOrwKOu4Ppq9fygYBrTgKfeAfhraJ3cfnI2hbcBm8qqvoZbiutCSuNG1fqV60aW9F4v2QKZWqEAdgGKJTAAPp16waXiRb6FdbCmi2Yivk1TcBja5mki6mVzMkAatXpgtGGvMS2zHzA2euE+YX6bEcbHQXQ7Ta1eHdWJaMJcBfYQKwiQRQmKAFnZ/1WoDj9ASmqYQZdY5plTcrdM0x4ABXJijtGM/Df/TRHSEVZ64ga6BFwpS6wu8XlpCav7ghEW+Nam5S6mnqZeqGKSiD6ZKBAN/xxnPxwEPH4Lp/egjK//ggtC3MdDloQ6RCrVfbz8sw7fCHxlKaWW2mDQFdsC0fLhcFvJrWD08lTICFnu8S7i9iIE+eSrAaVcWR0AkLUC+rEohlsSmr0hX3pH/znFmbCLHUBC2qsdRR93JWNQZVWggc3DijKnkz1QRbeZkExD5ST0bkveJ0s/uIyHijc2wlNWczpevm+WhJ18/uovVKwbuxsviqrJp6Ph60IbyJoHeqBIxpV7kl6OiOe38NX737MPKRU8574TpoWxDS0YbWJdU+sd2czQCa9Lgx6qvsA9ZgZArr3oonGsrkKkGJsw2vshpPyI2OAMLdpGJNckuXmGaYqtGhJpc2KOxxYlhezUrVYE+V8g3yapUzOGfVZlVwK5a2FgLfQATOjCpva7Py6Hz9nG15uerj8NWhKVJXCFw4ytl7Xn1YmXv1rx5STKifRVUd20kqwpbGc3GD0oKwRgw+GHnjU43qC/8oOsgrsdDgGXEy3VIYJEYUQOLBYkk1enw+FECV6ZdhKWV6WrWb1WRsA7PSj5rEpqRfOAlyIEtdWapc5kdxNFCfWwwK+fJtXk1S9XjzlK7OOFPQC+DVbIkMJyQGK1veHn6MquCbi1RZ7uNVczodN9LSzEkXM6Kq4LGlWFVcA4Gr2X5sqN658DIc0o/ps9jStDxpKA3SebvoOieS68SiTZ6DWBiT6Dfm1YamK3RQNqF11tT9cSau8n0F76a9dJx0f6dHgNO7iT5eHHchmqF17i05kJwvLEd0J1T+Af7xcDWE1whOxtgxrTtAuRqVi0crtWkrWXt/2pSn20uFLUdvzbS/1QVxQ18yazo0TPv4V74bC2xs/odXN61a+Usj3ZVcTk6FSQOmX56GsxHbR8WOhMpw4FUrsRaxJZDxJNNRSgKCYKGeoIEhuXFCLiRflhcfzJyYQEVuMHInMZ/KaqoPxmQ4KSohDwLrChVYuAHHmTEwj0RUwb4DrBhxFYAMMMmuQH5W4DprkX/l0jXHJukDXWRkEZBG6DlMyueA/Rzs6fsjwPZpHy8HKpiB+6R6QnmrKm8ldT5+vbvPIveVYGvxIQU8r4ebu7/C1PipzAxT6VqoR6V2zHCVlhnsVw+kdt45nbDnr18FrcrEN4/Azx+PRN5rLy/CpvWtjV50/8MLcO+PT4hB2q7YfhZc6LU+Okvv0H0gh8GU473KAd/EsJhMDkgcoRoikw/gNhXE8dCv7vtjH9ao8PBwM+PkTBDOrD73CICOXIHxvSetA5SDJy1MR37aFqY9n63nTY2hhdie6soATBOrpBKRrjC9TYG3KrNg5Gf3vrsKa1zOVKBy4a4reXPpliig7aCUoE6ijfLl2Ukib7vO/VScYjmBgSS0CimtV2zWaPfQj+/s6/Grf1iFFZKmbp5cnrZQFB+4UtylfTvaTZVQnzJImAoWIBpWTSzq1kU2IWzfua8+o2V4ESDVnhxU4zLkIdLdaAdjP7ijb8WYqHPbuAdBPAwRq6aDCLmsjDiEm1ri8Jet/JVh1dB9OsEJmrbXrYGHj0/13YdPQO14pMDCcM83j4L3wgK85cL18LzOpyiGGT9S+4Laf4z6s9vdsXC8sn9q5UAqmhGutwajOB6MbRw6/vD7JyGXFRfSWVkVZBcOTMKqfLAUwKVUy0RfPTVDnlyI4Z7vH4N7f3QCQjLzyFirOTbOUg6fSvfI2Crd8u3j8KbzO2HbuacafdPQfsuM/MO5Y/DFO35hti0LJujCR779uTf5sILygld/fjAO40oUMWYDXHbswffljHqaxIkictAKo1zyjlYPmfE7SuOKGc1AK3+nVlmnZ4/C17/zBNWKwIdw913HHcOFE5MfTU229rWZJ7seeYxN7384KL5gow1nb1iqQGXqtaCvPnjwOHzlW4fgez95QkyKQRmqFsYj/3Xj71VhBeUlr/9yKa6H42HIttDmUXqSl9VmB3KgnkZxarN9tXMu3kcPGbtSDadT1pOOE6QHtUh52RvkZ4fn4cvVx+CRQ3UgFq1ZBbf8ife/pGm1+Lbus2b/+RvH+uohTN/9UB36upce2ZrB0voxZ/D7fnAUvvvjJ+D7Dz8h5hCglBP0De7eN3bpigKID+AWRuFwFIpG2byr+lyEIQeqD7mcVpF1ryUaFxsLFnUfK9VBRbb3MK09GAAs7uFCMnXPY3Drfz+mphIiAya0K6MffskpdcMPv3lj9YbpJ3c/fsIafOBgBBdvaTJngB5rsAGqjxyah+89chz2E1CPPRmI6TMp8W4H2djn/u7VK+rCOf8KDlIYpg+hpJtq0W8WXauv9j85UJ8JEWCNIa46vKFDJpjFTEePrCHF/ZNZZ/6jtTqMffHn8ItH62C7lk/oHvjM0G9XoUWhOHAlZs7OH/4q8jpdhAvPy5bPjDmPcPhoALd/tw4/8E/Ao48viKo+qMdVOjS1Yb4+OVbpXlGQXtR7aykIYTggJmUsUu0IuEIf33Ji3Xy5Vs2HGXqmxIDwvN+9dYaiWF2ZqX7MxGvJvKpymiCLdzFgFMHCnaVzYG/1MCxQXM92cLcVLVQmlgGY8f0nPbTsaYqWeRvJO/D8dQDrHMYnb4P/+1UdDj0eZKbFpOhTLQzDyTAIpz51besfRqtyyR99o0Tn+1gURT0RnY//Qj5JXBQhGVNl/+537oZcnlFJTHDkjRdMbNfE/yE1OQAX1T9Q2FmHj9Rh/NZfUliWDKgCDtzy0eXPmzpw6Tp/fIZ1QxyWjy/AriNPRp6cPVDOGMh9o5RslvwUUxAFBz7e/9IqnAYp9U9zkIrqHqT2zlT3cl6hHMQwHvDvXrkAQi6ti2FWr7S3GLHCnJxz1UygJiZaSyZiQ3QLtmJWmcZ1sRoBG5j6RLe/1EnK18+VCoXCjkKBXFch21cZeJH/VBdGwC3Oz88XeSek+dp8bahv82mtbq/44HQpCHA4COIdcRSL9gKc1cmQYsSuGAds6smFaMCv9uXV/rMkGZPlN0pfqxAIhwVQbTFLNdONWoQ6YPNtRANmG0a+OvrqylKFi5mxXWe44Nglu2Az1+YzYPNer3blY+9+wQg8y8LnnK2H8+QnDfsJmB5V76q6jwmgsWj0QvtqURCP/O/XrhyDXJ5VyYCVs6tld84RGIuZ6dVd2QLLdvTEwVYNLey7/dOvqTYrtFyZKR7fsHGU0u2SU2A6kqHdZEpMKqfyl31nPyuA7b1uv2dFzq4ojAYJnEWuAwsWFQBV6xK01TA6OTA71edDLs+6LPJb/uabbpPsKtlTzsGqjStaWg7OUqimr3rDpX6zAt/7tw8OkpE0TOrCZj6fq5syzgTQxXyulmBYiwD7F3+w+RkDbH9lprQQMPKRxiXFmgKYfG5YBVRZ5Qs2DUf2f+mKnE1XkTR1sr/88jvmCKhe41TsBLJJC9aVqxOLrf13XjdTcjs7hkl92KHYF9NTtovp2oUqYaHxOIh9ODJ4+abTBljO8k8UCsSgUTmK2Saq0oEDUoA1ZKbKjzR4w9hfqC/03PeFt/qQy6qSpgF5Ck8OALOm0y1HWAxDd3/2dYuYhut9VsEaRssa1FOzphtuJVMNsMVDAYvwqTX8L988Bn/2xo0rCtgy6csLcTR4IopKGLKiuC4xzLtq26qaNqAZqEsMIuuTepMDdZXKkrH286+8c4yqaV6l12wX+r7zhZ5qY5q3fuiBQafgEJtam7kx5qaNMTM9e6p3AWdSR6oAaTVD+G5da6wjWhgZ6Fm+1V8enys6dRgk11MvsWWXquI5YzLhKxWMqvTRSDIrZ9QwkkvyBHRXJ3ry+P4qlVM2DLmw91sUX8fK7FSPn95fuuqekmsXxh3X2aK9A7LKtxLAOtJzkBhXcp9SAVJ6sHSFkVuLkcpwkMBf2XWRMwktSmX8kBc7bCeBbyeBsySAGHDHvQYlOfIJsLEEqqrytcWvwcs45w58/frX5037VrG01NxOyyXvmS45tjtMACxp5rQVUNNGmKM8B25BAJXvQ1sBk287rp2JjiU6rCiLUSTtYByzahzGs/Vg4UBI0TEI+bhP9K8OXj0MPTq+hXyfBNJ4s9Q/U1Z8Ys0TSGXkiZgTk/1JenEsjv7m9s+8oQK5rGppaQr3rt5pz+mwR0nt7EXTv0W3icakqwmTAw6bRtss1XgL9awuqSndEZkZMhUxNb8PeJS2Pxa9ExyuQ0OIEVgUmueTFlnIxzDgR2M5YEZjv6ykc3VmbABguneDCclxlXWEgPqs+3xzeWo5JVi3EUjtKBoGC/pli1aLyflbkonb5LSrltqiFGIkEzEoBku3ysIEuOofavsm6Q2oh80GPYQ6GDDrPFRhJ6cG3WshPZFVckZeeJwBLEuPOsMvtPyfn74kj/GvEWkKVq90m2e7OAwL4S50kjmD9WwnaMYgttQYGQzTbV7VOK8qQ7YtV2NrfzmhsKV7Kkr6o23VCByZGmBDfAFmkMNYz2mEqY6E5iws3YTBdNFR7CrxfwRt631Tn7p4CnJZM5IB64tfs7eLFdxBql57Gdg+mSCTgM4sxMFdYd31HSsuglMglxZsUQyFqcnQQLIpomZUBQ3GTLcCDSOEZLhJNY2K6pAo8MdYimVBpk+1KEkDFlD3AQQ9ypqemCt7p2aURPBJO+750ieXbsuQy+oUA9azL/rKzsiGzTbD3QerbxtYIn2t1D/dzWDdMOGmnOxWTaNRj26CyT4m9VQm9VXTbBsXL3VGDXiJUch2908AD9JPyxLVVHpyme7+wiDdR0yOYTV10sWBqY93541R1qC05Q1Iy1uuvX8XWfwVsvA9ad2LaFTiQ+WWvwitYiZipd1WrpsNwzrGfUWeA9sSLiay5BlZ9Jiy8JlYBsqy5/5T5aYKROuoWPhLI51H7Av5ei0KoTIxfEGun65haW38niby9etfO0nI6qHVSUViWrfVo0czOeqJmmEwZVyBZkDjKKDMVuN0AdKtwFKdvYR+qweM0eSKUjtAPe1m+gOUNlaV4vzdOVDXviybWdPSe92M1+E448SOpWS8LNkGNolY2bohixw7q6CjV9yvqtiXt491RHBAjEElY/cR+UrJsR+KFvosNKwaJ77SQDAvE4yqlqLFVBCN3PCRV1YhlzNCVgSsWt5T+V4JbWe4o2CXbNH21QQK0FENWkTAwJXHXKMSZMOyHMwchBKkql1pKKt9CWLp8CdcMq0SyIgUmYZhfBdtToz+6dZJyOWMkhUFq5YP/v2PPPIqDBMYewmARaWrQlZfRdXqSu13pX6rRy3kgKQoFQuETiqa8rFMGFXrsUpvJWBX58Nw5FNXb61CLmeknBawaimPzhWhAL0Unt1JoCzZussMD8OqXgMGuIpZ+TafN0s22VMMGunQKTOh0lA1jian/xQ7eXKykho8I5czU04rWBvlrz57qFQgvdZ2rR0ESo+Y19O9B9I9aDWzRmlwxjHvXjIbRdGBoM6qJ+FYtdKXA/S5JM8oWBtldO+RImxwvU5kRYuzLqkMwgAjHwWLgAUROxrEge8GG/yBHsyB+RyX/wfCcpI/0NUGxgAAAABJRU5ErkJggg=='; // Reemplaza con tu logo en base64
      doc.addImage(logoBase64, 'PNG', 20, 10, 45, 20);
      } catch (error) {
        // Fallback: si hay error con la imagen, usar el círculo azul
        doc.setFillColor(65, 105, 225); // Azul del logo
        doc.circle(35, 20, 15, 'F'); // Círculo azul simulando el logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('COVEMS', 30, 22);
        doc.text('S.C.', 32, 25);
      }

      try {
        const logoBase64 = "data:image/png;base64,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"
        doc.addImage(logoBase64, 'PNG', 230, 8, 40, 23);
      } catch (error) {
        // Fallback: si hay error con la imagen, usar el círculo azul
        doc.setFillColor(65, 105, 225); // Azul del logo
        doc.circle(35, 20, 15, 'F'); // Círculo azul simulando el logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('COVEMS', 30, 22);
        doc.text('S.C.', 32, 25);
      }
    // Tabla
    autoTable(doc, {
        head: [columns],
        body: rowsData,
        startY: 40,
        styles: {
            fontSize: 8,
            minCellHeight: 12,
            cellPadding: 3
        },
        headStyles: {
            fontSize: 9,
            fillColor: [52, 152, 219]
        },
        columnStyles: {
            0: { valign: 'middle' },
            1: { valign: 'middle' },
            4: { valign: 'middle' },
            5: { valign: 'middle' },
            7: { valign: 'middle' },
            3: { valign: 'middle' },
            2: {
                cellWidth: 70,
                valign: 'top'
            },
            6: {
                cellWidth: 25,
                valign: 'middle'
            }
        },
        willDrawCell: function(data) {
            if (data.column.index === 2 && typeof data.cell.raw === 'object' && data.cell.raw.content) {
                const lines = data.cell.raw.content.split('\n');
                if (lines.length > 1) {
                    data.cell.text = [lines[0]];
                }
            }
        },
        didDrawCell: function (data) {
            if (data.column.index === 2 && typeof data.cell.raw === 'object' && data.cell.raw.content) {
                const lines = data.cell.raw.content.split('\n');
                if (lines.length > 1) {
                    doc.setFontSize(6);
                    doc.setTextColor(100);
                    doc.text(lines[1], data.cell.x + 3, data.cell.y + 10);
                    doc.setFontSize(8);
                    doc.setTextColor(0);
                }
            }
        }
    });
    
    // Calcular el total
    const total = rows.reduce((sum, row) => sum + parseFloat(row.importe), 0);
    
    // Obtener la posición Y final de la tabla
    const finalY = doc.lastAutoTable.finalY || 100;
    
    // Agregar total
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 60, finalY + 15);
    
    // Agregar espacio para firma
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('FIRMA DE AUTORIZACIÓN:', 30, finalY + 40);
    doc.line(30, finalY + 50, 120, finalY + 50); // Línea para la firma
    
	const pdfBlob = doc.output("blob");
	const url = URL.createObjectURL(pdfBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "movimientos.pdf";
	link.click();
       };

       const generarPagos = async () => {
		if (rows.length === 0) {
			setSaveMessage("No hay datos para guardar");
			return;
		}
		setIsSaving(true);
		setSaveMessage("");
		// 1. Descargar el PDF
		handlePrint();
		// 2. Subir los datos a la base de datos
		try {
			for (const row of rows) {
				await fetch('/api/movimientos', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(row)
				});
			}
			setSaveMessage("Datos guardados exitosamente");
			setRows([]); // Limpiar la tabla después de guardar
		} catch (error) {
			console.error('Error:', error);
			setSaveMessage("Error al procesar los datos");
		} finally {
			setIsSaving(false);
			setTimeout(() => setSaveMessage(""), 3000);
		}
       };

       

       const [rows, setRows] = useState(initialRows);
       const [form, setForm] = useState({
	       empresa: "",
	       fecha: "",
	       concepto: "",
	       subconcepto: "",
	       tipoComprobancion: "",
	       tipo: "Ingreso",
	       importe: "",
	       banco: "",
	       estatus: "Pendiente",
       });
       const empresaRef = useRef(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm({ ...form, [name]: value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setRows([...rows, { ...form, importe: Number(form.importe) }]);
		setForm({ empresa: "", fecha: "", concepto: "", subconcepto: "", tipoComprobancion: "", tipo: "Ingreso", importe: "", banco: "", estatus: "Pendiente" });
		if (empresaRef.current) {
			empresaRef.current.focus();
		}
	};

	const handleDelete = (index) => {
		const newRows = rows.filter((_, idx) => idx !== index);
		setRows(newRows);
	};       return (
	       <div className="p-8 mx-auto min-h-screen">
		       <h1 className="text-2xl font-bold mb-6 text-white">Registro de Movimientos</h1>
		       <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 mb-8 bg-gray-900 p-6 rounded-lg shadow">
				<select
					ref={empresaRef}
					name="empresa"
					value={form.empresa}
					onChange={handleChange}
					required
					className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-48"
				>
					<option value="">Selecciona empresa</option>
					<option value="ARGOS">ARGOS</option>
					<option value="CLARO SEGUROS">CLARO SEGUROS</option>
					<option value="ASESORIAS">ASESORIAS</option>
				</select>
			       <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-40" />
			       <input type="text" name="concepto" placeholder="Concepto" value={form.concepto} onChange={handleChange} required className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-48" />
			       <input type="text" name="subconcepto" placeholder="Subconcepto (opcional)" value={form.subconcepto} onChange={handleChange} className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-48" />
			       <input type="number" step="0.01" name="importe" placeholder="Importe" value={form.importe} onChange={handleChange} required min="0" className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-32" />
			       <select name="banco" value={form.banco} onChange={handleChange} required className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-32">
				       <option value="">Banco</option>
				       <option value="BBVA">BBVA</option>
				       <option value="Banorte">Banorte</option>
				       <option value="Santander">Santander</option>
				       <option value="Citibanamex">Citibanamex</option>
				       <option value="HSBC">HSBC</option>
				       <option value="Scotiabank">Scotiabank</option>
				       <option value="Inbursa">Inbursa</option>
				       <option value="Banco Azteca">Banco Azteca</option>
				       <option value="Bancoppel">Bancoppel</option>
				       <option value="Afirme">Afirme</option>
				       <option value="Banjército">Banjército</option>
				       <option value="Banjio">Banjio</option>
				       <option value="Banregio">Banregio</option>
				       <option value="Banco Multiva">Banco Multiva</option>
				       <option value="Banco Famsa">Banco Famsa</option>
			       </select>
			       <select name="tipo" value={form.tipo} onChange={handleChange} required className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-32">
				       <option value="Ingreso">Ingreso</option>
				       <option value="Egreso">Egreso</option>
			       </select>
			       <select name="estatus" value={form.estatus} onChange={handleChange} required className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-32">
				       <option value="Pendiente">Pendiente</option>
				       <option value="Completado">Completado</option>
			       </select>
			       <select name="tipoComprobancion" value={form.tipoComprobancion} onChange={handleChange} required className="border border-gray-700 bg-black text-white rounded px-3 py-2 w-48">
				       <option value="">Tipo Comprobación</option>
				       <option value="FACTURA">FACTURA</option>
				       <option value="NO FACTURA">NO FACTURA</option>
				       <option value="IMPUESTOS">IMPUESTOS</option>
				       <option value="NOMINA">NOMINA</option>
				       <option value="ASIMILADOS">ASIMILADOS</option>
				       <option value="PRESTAMO">PRESTAMO</option>
			       </select>
			       <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Agregar</button>
		       </form>
		       
		       {saveMessage && (
		           <div className={`mt-4 p-3 rounded ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
		               {saveMessage}
		           </div>
		       )}
		       
		<div className="overflow-x-auto">
			{rows.length > 0 && (
				<button
					onClick={generarPagos}
					disabled={isSaving}
					className="mb-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
				>
					{isSaving ? 'Procesando...' : 'Generar Pagos'}
				</button>
			)}
			       <table className="min-w-full bg-gray-900 rounded-lg shadow">
				       <thead>
					       <tr className="bg-blue-800 text-white">
						       <th className="py-3 px-4 text-left">Empresa</th>
						       <th className="py-3 px-4 text-left">Fecha</th>
						       <th className="py-3 px-4 text-left">Concepto</th>
						       <th className="py-3 px-4 text-left">Importe</th>
						       <th className="py-3 px-4 text-left">Banco</th>
						       <th className="py-3 px-4 text-left">Tipo</th>
						       <th className="py-3 px-4 text-left">Tipo Comprobancion</th>
						       <th className="py-3 px-4 text-left">Estatus</th>
						       <th className="py-3 px-4 text-left">Acciones</th>
					       </tr>
				       </thead>
				       <tbody>
					       {rows.map((row, idx) => (
						       <tr key={idx} className={idx % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}>
							       <td className="py-2 px-4 text-white">{row.empresa}</td>
							       <td className="py-2 px-4 text-white">{row.fecha}</td>
							       <td className="py-2 px-4 text-white">
							         {row.concepto}
							         {row.subconcepto && (
								         <div className="text-xs text-gray-300 mt-1">{row.subconcepto}</div>
							         )}
							       </td>
							       <td className="py-2 px-4 text-white">{row.importe}</td>
							       <td className="py-2 px-4 text-white">{row.banco}</td>
							       <td className="py-2 px-4 text-white">{row.tipo}</td>
							       <td className="py-2 px-4 text-white">{row.tipoComprobancion}</td>
							       <td className="py-2 px-4 text-white">{row.estatus}</td>
							       <td className="py-2 px-4">
								       <button
									       onClick={() => handleDelete(idx)}
									       className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition"
								       >
									       Eliminar
								       </button>
							       </td>
						       </tr>
					       ))}
				       </tbody>
			       </table>
		       </div>
	       </div>
       );
}
