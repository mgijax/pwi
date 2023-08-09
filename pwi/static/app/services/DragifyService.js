

(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('DragifyService', DragifyService);

	/*
	 */
	function DragifyService($document, $q, $timeout) {
            // Make an element draggable by attaching drag behavior.
            //
            // Args:
            //   elt (DOM node) the element to make draggable
            //   behavior (object) Object containing drag event handlers.
            //      dragstart: called at the start of the drag (on mousedown).
            //          This handler can return false to cancel the drag.
            //      drag: called during the drag (on mousemove)
            //      dragend: called at the end of the drag (on mouseup)
            //   root (SVG node) - the root of 'draggification' where drag and
            //      dragend events are detected. Must be elt or an ancestor. Optional.
            //      Default is document.body
            //   dragThis - the object bound to 'this' in behavior calls
            //      Default is window
            //
            // All handlers are passed two arguments:
            //    evt: the actual mouse event (mousedown, mousemove, mouseup)
            //    data: an object carrying essential drag data. Handlers are free
            //          to attach additional fields as needed.
            //      target - same as evt.target
            //      startX, startY - the starting client coordinates of the drag
            //      deltaX, deltaY - the total distace traveled since dragstart
            //      cancel - a function to call if you want to cancel the drag
            //
            // Only onmousedown is listened for initially. When mousedown is detected
            // (ie on dragstart) the handlers for mousemove and mouseup are attached
            // to the root node. On mouseup (dragend) they are removed. This avoids the
            // handlers being called outside of a drag operation.
            //
            function dragify (elt, behavior, root, dragThis) {
              behavior = behavior || {}
              root = root || document.body
              dragThis = dragThis || window
              let dragging
              const minTravel = behavior.minTravel || 2
              function startDrag (evt) {
                if (evt.ctrlKey) return
                dragging = {
                  target: evt.target,
                  root: root,
                  rootRect: root.getBoundingClientRect(),
                  startX: evt.clientX,
                  startY: evt.clientY,
                  deltaX: 0,
                  deltaY: 0,
                  cancel: () => cancelDrag()
                }   
                if (behavior.dragstart && behavior.dragstart.call(dragThis, evt, dragging) === false) {
                  dragging = null
                  return
                }   
                root.addEventListener('mousemove', drag)
                root.addEventListener('mouseup', endDrag)
                root.addEventListener('mouseleave', endDrag)
                evt.stopPropagation()
                // console.log('START DRAG')
              }
              function drag (evt) {
                if (!dragging) return
                dragging.deltaX = evt.clientX - dragging.startX
                dragging.deltaY = evt.clientY - dragging.startY
                behavior.drag && behavior.drag.call(dragThis, evt, dragging)
                evt.stopPropagation()
                // console.log('DRAG')
              }
              function endDrag (evt) {
                if (!dragging) return
                evt.stopPropagation()
                if (Math.abs(dragging.deltaX) < minTravel || Math.abs(dragging.deltaX) < minTravel) {
                    cancelDrag()
                    return
                }
                behavior.dragend && behavior.dragend.call(dragThis, evt, dragging)
                dragging = null
                root.removeEventListener('mousemove', drag)
                root.removeEventListener('mouseup', endDrag)
                root.removeEventListener('mouseleave', endDrag)
                // console.log('END DRAG')
              }
              function cancelDrag () {
                behavior.dragcancel && behavior.dragcancel.call(dragThis, dragging)
                root.removeEventListener('mousemove', drag)
                root.removeEventListener('mouseup', endDrag)
                root.removeEventListener('mouseleave', endDrag)
              }
              elt.addEventListener('mousedown', startDrag)
            }
            return { dragify }
	}
})();
