import "bootstrap";
//css
import "../scss/styles.scss";

$(function () {
    let state = 0;

    //ファイルセレクト
    $('#fileSelect').on('change', function () {
        const file = $(this).prop('files')[0];
        const elem = this;
        clearCanvas();
        $(this).parent().next('span').html(file.name);
        const fileReader = new FileReader();
        fileReader.readAsDataURL(elem.files[0]);
        fileReader.onload = (function () {
            const imgTag = $('<img />', { class: 'resize-image', src: fileReader.result });//`<img class='resize-image' src='${fileReader.result}'>`;
            $(".resize-image-area").append(imgTag);
            resizeableImage(imgTag);
        });
        changeState(1);
    });

    //最初からやり直す
    $('.destroyResult').on('click', function () {
        $('#fileSelect').val('');
        $('#fileSelect').parent().next('span').html('');
        clearCanvas();
        changeState(0);
    })

    const clearCanvas = function () {
        $(".resize-image-area").empty();
    }

    //ステート変更
    const changeState = function (state) {
        state = state;
        if (state == 0) {
            $('#sectionImage').addClass('d-none');
        } else {
            $('#sectionImage').removeClass('d-none');
        }
    }

    //ダウンロード
    $('#result-download').on('click', function () {
        let filename = $('#fileSelect').parent().next('span').text();

        //let link = document.getElementById("download");
        this.href = $('#result-image').attr('src');
        this.download = filename.split(".").slice(0, -1).join(".") || filename + "";
    })

    const resizeableImage = function (image) {
        let $container;
        const
            orig_src = new Image(),
            image_target = $(image).get(0),
            event_state = {},
            constrain = false,
            min_width = 10,
            min_height = 10,
            max_width = 1920,
            max_height = 1920,
            resize_canvas = document.createElement('canvas');

        const init = function () {

            // Create a new image with a copy of the original src
            // When resizing, we will always use this original copy as the base
            orig_src.src = image_target.src;

            // Add resize handles
            $(image_target).wrap('<div class="resize-container"></div>')
                .before('<span class="resize-handle resize-handle-nw"></span>')
                .before('<span class="resize-handle resize-handle-ne"></span>')
                .before('<span class="resize-handle resize-handle-nc"></span>')
                .before('<span class="resize-handle resize-handle-wc"></span>')
                .after('<span class="resize-handle resize-handle-se"></span>')
                .after('<span class="resize-handle resize-handle-sw"></span>')
                .after('<span class="resize-handle resize-handle-ec"></span>')
                .after('<span class="resize-handle resize-handle-sc"></span>')
                ;

            // Get a variable for the container
            $container = $(image_target).parent('.resize-container');

            // Add events
            $container.on('mousedown', '.resize-handle', startResize);

            $container.on('mousedown', 'img', startMoving);

            $('#showResult').off().on('click', crop);

            $('select[name="ratio"],#customratio input').off().on('change', setRatio);
            $(image_target).one('load', function () {
                setRatio();
            });

        };

        const startResize = function (e) {
            e.preventDefault();
            e.stopPropagation();
            saveEventState(e);
            $(document).on('mousemove', resizing);
            $(document).on('mouseup', endResize);
        };

        const endResize = function (e) {
            e.preventDefault();
            $(document).off('mouseup touchend', endResize);
            $(document).off('mousemove touchmove', resizing);
            resizeImage($container.width(), $container.height());
        };


        const saveEventState = function (e) {
            // Save the initial event details and container state
            event_state.container_width = $container.width();
            event_state.container_height = $container.height();
            event_state.container_left = $container.offset().left;
            event_state.container_top = $container.offset().top;
            event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft();
            event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();

            // This is a fix for mobile safari
            // For some reason it does not allow a direct copy of the touches property
            if (typeof e.originalEvent.touches !== 'undefined') {
                event_state.touches = [];
                $.each(e.originalEvent.touches, function (i, ob) {
                    event_state.touches[i] = {};
                    event_state.touches[i].clientX = 0 + ob.clientX;
                    event_state.touches[i].clientY = 0 + ob.clientY;
                });
            }
            event_state.evnt = e;
        }

        const resizing = function (e) {
            var mouse = {}, width, height, left, top, offset = $container.offset();
            mouse.x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft();
            mouse.y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();

            // Position image differently depending on the corner dragged and constraints
            if ($(event_state.evnt.target).hasClass('resize-handle-se')) {//右下
                width = mouse.x - event_state.container_left;
                height = mouse.y - event_state.container_top;
                left = event_state.container_left;
                top = event_state.container_top;
            } else if ($(event_state.evnt.target).hasClass('resize-handle-sw')) {//左下
                width = event_state.container_width - (mouse.x - event_state.container_left);
                height = mouse.y - event_state.container_top;
                left = mouse.x;
                top = event_state.container_top;
            } else if ($(event_state.evnt.target).hasClass('resize-handle-nw')) {//左上
                width = event_state.container_width - (mouse.x - event_state.container_left);
                height = event_state.container_height - (mouse.y - event_state.container_top);
                left = mouse.x;
                top = mouse.y;
                if (constrain || e.shiftKey) {
                    top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
                }
            } else if ($(event_state.evnt.target).hasClass('resize-handle-ne')) {//右上
                width = mouse.x - event_state.container_left;
                height = event_state.container_height - (mouse.y - event_state.container_top);
                left = event_state.container_left;
                top = mouse.y;
                if (constrain || e.shiftKey) {
                    top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
                }
            } else if ($(event_state.evnt.target).hasClass('resize-handle-nc')) {//上辺
                width = event_state.container_width;
                height = event_state.container_height - (mouse.y - event_state.container_top);
                left = event_state.container_left;
                top = mouse.y;
                if (constrain || e.shiftKey) {
                    //top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
                    width = height / orig_src.height * orig_src.width;
                }
            } else if ($(event_state.evnt.target).hasClass('resize-handle-wc')) {//左辺
                width = event_state.container_width - (mouse.x - event_state.container_left);
                height = event_state.container_height;
                left = mouse.x;
                top = event_state.container_top;
                if (constrain || e.shiftKey) {
                    //top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
                }
            } else if ($(event_state.evnt.target).hasClass('resize-handle-sc')) {//下辺
                width = event_state.container_width;
                height = mouse.y - event_state.container_top;
                left = event_state.container_left;
                top = event_state.container_top;
                if (constrain || e.shiftKey) {
                    width = height / orig_src.height * orig_src.width;
                }
            } else if ($(event_state.evnt.target).hasClass('resize-handle-ec')) {//右辺
                width = mouse.x - event_state.container_left;
                height = event_state.container_height;
                left = event_state.container_left;
                top = event_state.container_top;

            }

            // Optionally maintain aspect ratio
            if (constrain || e.shiftKey) {
                height = width / orig_src.width * orig_src.height;
            }

            if (width > min_width && height > min_height && width < max_width && height < max_height) {
                // To improve performance you might limit how often resizeImage() is called
                //resizeImage(width, height);
                // Without this Firefox will not re-calculate the the image dimensions until drag end
                $container.offset({ 'left': left, 'top': top });
                $container.width(width);
                $container.height(height);
            }
        }

        const resizeImage = function (width, height) {
            resize_canvas.width = width;
            resize_canvas.height = height;
            resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, width, height);
            $(image_target).attr('src', resize_canvas.toDataURL("image/png"));
        };

        const startMoving = function (e) {
            e.preventDefault();
            e.stopPropagation();
            saveEventState(e);
            $(document).on('mousemove', moving);
            $(document).on('mouseup', endMoving);
        };

        const endMoving = function (e) {
            e.preventDefault();
            $(document).off('mouseup', endMoving);
            $(document).off('mousemove', moving);
        };

        const moving = function (e) {
            var mouse = {};
            e.preventDefault();
            e.stopPropagation();
            mouse.x = (e.clientX || e.pageX) + $(window).scrollLeft();
            mouse.y = (e.clientY || e.pageY) + $(window).scrollTop();
            $container.offset({
                'left': mouse.x - (event_state.mouse_x - event_state.container_left),
                'top': mouse.y - (event_state.mouse_y - event_state.container_top)
            });
        };

        const crop = function () {
            let crop_canvas, context;
            const
                left = $('.overlay').offset().left - $container.offset().left,
                top = $('.overlay').offset().top - $container.offset().top,
                width = $('.overlay').width(),
                height = $('.overlay').height();
            console.log(left, top, width, height);
            crop_canvas = document.createElement('canvas');
            crop_canvas.width = width;
            crop_canvas.height = height;
            context = crop_canvas.getContext('2d');
            context.beginPath();
            context.fillStyle = 'rgb( 255, 255, 255)';
            context.fillRect(0, 0, width, height);
            context.drawImage(image_target, left, top, width, height, 0, 0, width, height);
            $('#result-image').attr('src', crop_canvas.toDataURL("image/png"));
            //var resultModal = new bootstrap.Modal(document.getElementById('result-modal'), {});
            //resultModal.show();

        }

        const setRatio = function () {
            //show/hide custom ratio
            if ($('select[name="ratio"]').val() == "custom") {
                $('#customratio').removeClass('d-none');
            } else {
                $('#customratio').addClass('d-none');
            }

            const component_ratio = getRatio();
            if (!component_ratio) {
                return;
            }
            const component_height = $('.component').height();
            const component_width = component_height * component_ratio;
            $('.component').width(component_width);

            const container_ratio = $container.width() / $container.height();

            console.log("component_ratio:" + component_ratio + " container_ratio:" + container_ratio + " $container.width():" + $container.width() + " $container.height():" + $container.height());
            let new_width, new_height, new_left, new_top;
            if (component_ratio > container_ratio) {
                //Landscape
                new_height = component_height;
                new_width = component_height * ($container.width() / $container.height());
                new_left = (component_width - new_width) / 2;
                new_top = 0;

            } else {
                //Portrait
                new_width = component_width;
                new_height = component_width * ($container.height() / $container.width());
                new_left = 0;
                new_top = (component_height - new_height) / 2;
            }
            console.log("new_width:" + new_width + " new_height:" + new_height + " new_left:" + new_left + " new_top:" + new_top);

            $container.offset({ 'left': $('.component').offset().left + new_left, 'top': $('.component').offset().top + new_top });
            $container.width(new_width);
            $container.height(new_height);
            resizeImage(new_width, new_height);
        }

        const getRatio = function () {
            if ($('select[name="ratio"]').val() == "custom") {
                if ($('input[name="ratio_type"]:checked').val() == "ratio") {
                    if ($('input[name="ratio_width"]').val() && $('input[name="ratio_height"]').val()) {
                        return $('input[name="ratio_width"]').val() / $('input[name="ratio_height"]').val();
                    } else {
                        return false;
                    }
                } else {
                    if ($('input[name="pixels_width"]').val() && $('input[name="pixels_height"]').val()) {
                        return $('input[name="pixels_width"]').val() / $('input[name="pixels_height"]').val();
                    } else {
                        return false;
                    }
                }
            } else {
                return $('select[name="ratio"]').val();
            }
        }


        init();
    };

});


