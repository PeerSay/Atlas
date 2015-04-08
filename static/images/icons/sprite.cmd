:: Script to build image sprites on Windows. Used as one-time action when any image changes/added/removed.
:: It produces: a) images/sprite.png and b) css\public\sprite.less.

:: Uses glue: http://glue.readthedocs.org/en/latest/installation.html
:: Pag: --optipng option is nice to have but fails for me

glue -r --cachebuster sprite --img=./ --less=../../css/public/ --namespace= --sprite-namespace="" --less-template=glue-tpl.jinja
