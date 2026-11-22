package com.example.dllvisualizer;

import java.util.ArrayList;
import java.util.List;

public class DoublyLinkedList {
    private Node head;
    private Node tail;
    private int size;

    public DoublyLinkedList() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    public void insertAtHead(int data) {
        Node newNode = new Node(data);
        if (head == null) {
            head = tail = newNode;
        } else {
            newNode.setNext(head);
            head.setPrev(newNode);
            head = newNode;
        }
        size++;
    }

    public void insertAtTail(int data) {
        Node newNode = new Node(data);
        if (head == null) {
            head = tail = newNode;
        } else {
            tail.setNext(newNode);
            newNode.setPrev(tail);
            tail = newNode;
        }
        size++;
    }

    // 1-based position (1 = head, size + 1 = tail)
    public boolean insertAtPosition(int data, int position) {
        if (position < 1 || position > size + 1) {
            return false;
        }

        if (position == 1) {
            insertAtHead(data);
            return true;
        }

        if (position == size + 1) {
            insertAtTail(data);
            return true;
        }

        Node temp = head;
        for (int i = 1; i < position - 1; i++) {
            temp = temp.getNext();
        }

        Node newNode = new Node(data);
        Node nextNode = temp.getNext();

        newNode.setNext(nextNode);
        newNode.setPrev(temp);
        temp.setNext(newNode);
        if (nextNode != null) {
            nextNode.setPrev(newNode);
        }

        size++;
        return true;
    }

    public boolean deleteNode(int data) {
        if (head == null) {
            return false;
        }

        Node temp = head;
        while (temp != null && temp.getData() != data) {
            temp = temp.getNext();
        }

        if (temp == null) {
            return false;
        }

        if (temp == head && temp == tail) {
            head = tail = null;
        } else if (temp == head) {
            head = head.getNext();
            head.setPrev(null);
        } else if (temp == tail) {
            tail = tail.getPrev();
            tail.setNext(null);
        } else {
            temp.getPrev().setNext(temp.getNext());
            temp.getNext().setPrev(temp.getPrev());
        }

        size--;
        return true;
    }

    public void clear() {
        head = null;
        tail = null;
        size = 0;
    }

    public int size() {
        return size;
    }

    public List<Integer> getForwardList() {
        List<Integer> list = new ArrayList<>();
        Node temp = head;
        while (temp != null) {
            list.add(temp.getData());
            temp = temp.getNext();
        }
        return list;
    }

    public List<Integer> getBackwardList() {
        List<Integer> list = new ArrayList<>();
        Node temp = tail;
        while (temp != null) {
            list.add(temp.getData());
            temp = temp.getPrev();
        }
        return list;
    }
}