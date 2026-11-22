package com.example.dllvisualizer;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dll")
@CrossOrigin(origins = "*")
public class DllController {

    private final DoublyLinkedList dll = new DoublyLinkedList();

    @GetMapping("/get")
    public ResponseEntity<List<Integer>> getList() {
        return ResponseEntity.ok(dll.getForwardList());
    }

    @GetMapping("/get-backward")
    public ResponseEntity<List<Integer>> getBackwardList() {
        return ResponseEntity.ok(dll.getBackwardList());
    }

    @GetMapping("/size")
    public ResponseEntity<Integer> getSize() {
        return ResponseEntity.ok(dll.size());
    }

    @PostMapping("/insert-head")
    public ResponseEntity<String> insertHead(@RequestParam int data) {
        dll.insertAtHead(data);
        return ResponseEntity.ok("Inserted " + data + " at Head successfully!");
    }

    @PostMapping("/insert-tail")
    public ResponseEntity<String> insertTail(@RequestParam int data) {
        dll.insertAtTail(data);
        return ResponseEntity.ok("Inserted " + data + " at Tail successfully!");
    }

    @PostMapping("/insert-position")
    public ResponseEntity<String> insertPosition(@RequestParam int data, @RequestParam int position) {
        boolean inserted = dll.insertAtPosition(data, position);
        if (!inserted) {
            return ResponseEntity.badRequest()
                    .body("Invalid position: " + position + ". Valid range is 1 to " + (dll.size() + 1));
        }
        return ResponseEntity.ok("Inserted " + data + " at position " + position + " successfully!");
    }

    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteNode(@RequestParam int data) {
        boolean deleted = dll.deleteNode(data);
        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Node with value " + data + " not found!");
        }
        return ResponseEntity.ok("Deleted node with value: " + data);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearList() {
        dll.clear();
        return ResponseEntity.ok("Doubly Linked List cleared successfully!");
    }
}